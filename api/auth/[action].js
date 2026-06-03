import { getSql } from '../_db.js';
import {
  hashPassword,
  verifyPassword,
  signSession,
  getSessionUser,
  sessionCookie,
  clearSessionCookie,
  newResetToken,
  hashResetToken,
  randomUUID,
  RESET_TTL_SECONDS,
} from '../_auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function send(res, status, data, setCookie) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  if (setCookie) res.setHeader('Set-Cookie', setCookie);
  res.end(JSON.stringify(data));
}

function publicUser(row) {
  return { id: row.id, email: row.email, full_name: row.full_name || null, role: row.role };
}

// Cria a tabela sob demanda (idempotente) para funcionar mesmo sem rodar ensureSchema.
async function ensureUsersTable(sql) {
  await sql.query(`create table if not exists qj_users (
    id text primary key,
    email text unique not null,
    password_hash text not null,
    full_name text,
    role text not null default 'user',
    reset_token_hash text,
    reset_expires timestamptz,
    created_date timestamptz not null default now(),
    updated_date timestamptz not null default now()
  )`);
}

async function findByEmail(sql, email) {
  const rows = await sql.query(`select * from qj_users where email = $1 limit 1`, [email]);
  return rows[0] || null;
}

async function handleSignup(sql, body, res) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const fullName = String(body.full_name || '').trim();

  if (!fullName) return send(res, 400, { error: 'Informe seu nome.' });
  if (!EMAIL_RE.test(email)) return send(res, 400, { error: 'E-mail inválido.' });
  if (password.length < MIN_PASSWORD) {
    return send(res, 400, { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` });
  }
  if (await findByEmail(sql, email)) {
    return send(res, 409, { error: 'Já existe uma conta com este e-mail.' });
  }

  const id = randomUUID();
  const rows = await sql.query(
    `insert into qj_users (id, email, password_hash, full_name) values ($1, $2, $3, $4) returning *`,
    [id, email, hashPassword(password), fullName],
  );
  const user = rows[0];
  const token = signSession({ uid: user.id, email: user.email, role: user.role });
  return send(res, 201, { user: publicUser(user) }, sessionCookie(token));
}

async function handleLogin(sql, body, res) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const user = await findByEmail(sql, email);
  // Mensagem genérica: não revela se o e-mail existe.
  if (!user || !verifyPassword(password, user.password_hash)) {
    return send(res, 401, { error: 'E-mail ou senha inválidos.' });
  }
  const token = signSession({ uid: user.id, email: user.email, role: user.role });
  return send(res, 200, { user: publicUser(user) }, sessionCookie(token));
}

async function handleMe(sql, req, res) {
  const session = getSessionUser(req);
  if (!session?.uid) return send(res, 200, { user: null });
  const rows = await sql.query(`select * from qj_users where id = $1 limit 1`, [session.uid]);
  if (!rows[0]) return send(res, 200, { user: null }, clearSessionCookie());
  return send(res, 200, { user: publicUser(rows[0]) });
}

function handleLogout(res) {
  return send(res, 200, { success: true }, clearSessionCookie());
}

async function handleRequestPasswordReset(sql, body, res) {
  const email = String(body.email || '').trim().toLowerCase();
  const generic = { success: true, message: 'Se houver uma conta com este e-mail, enviaremos instruções.' };
  if (!EMAIL_RE.test(email)) return send(res, 200, generic);

  const user = await findByEmail(sql, email);
  if (user) {
    const { raw, hash } = newResetToken();
    const expires = new Date(Date.now() + RESET_TTL_SECONDS * 1000).toISOString();
    await sql.query(
      `update qj_users set reset_token_hash = $1, reset_expires = $2, updated_date = now() where id = $3`,
      [hash, expires, user.id],
    );
    // Entrega de e-mail ainda não plugada (sem provedor no runtime Neon).
    // Quando integrar (ex.: Resend), enviar: `${origin}/reset-password?token=${raw}`.
    const link = `/reset-password?token=${raw}`;
    await sql.query(
      `insert into qj_system_logs (action, details, log_type, source) values ($1, $2, 'info', 'auth')`,
      ['Reset de senha solicitado', `Usuário ${email} — link (não enviado): ${link}`],
    ).catch(() => {});
    // Sem provedor de e-mail: em dev, devolve o token para permitir teste manual.
    const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
    if (!isProd) return send(res, 200, { ...generic, dev_reset_token: raw });
  }
  return send(res, 200, generic);
}

async function handleResetPassword(sql, body, res) {
  const token = String(body.token || '');
  const password = String(body.password || '');
  if (!token) return send(res, 400, { error: 'Token de redefinição ausente.' });
  if (password.length < MIN_PASSWORD) {
    return send(res, 400, { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` });
  }
  const hash = hashResetToken(token);
  const rows = await sql.query(
    `select * from qj_users where reset_token_hash = $1 and reset_expires > now() limit 1`,
    [hash],
  );
  const user = rows[0];
  if (!user) return send(res, 400, { error: 'Link inválido ou expirado. Solicite um novo.' });

  await sql.query(
    `update qj_users set password_hash = $1, reset_token_hash = null, reset_expires = null, updated_date = now() where id = $2`,
    [hashPassword(password), user.id],
  );
  return send(res, 200, { success: true });
}

export default async function handler(req, res) {
  const action = req.query.action;

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const sql = getSql();
    await ensureUsersTable(sql);
    const body = req.method === 'POST' ? (req.body || {}) : {};

    switch (action) {
      case 'me':
        if (req.method !== 'GET') return send(res, 405, { error: 'Método não permitido.' });
        return await handleMe(sql, req, res);
      case 'logout':
        if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
        return handleLogout(res);
      case 'signup':
        if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
        return await handleSignup(sql, body, res);
      case 'login':
        if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
        return await handleLogin(sql, body, res);
      case 'requestPasswordReset':
        if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
        return await handleRequestPasswordReset(sql, body, res);
      case 'resetPassword':
        if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });
        return await handleResetPassword(sql, body, res);
      default:
        return send(res, 404, { error: `Ação desconhecida: ${action}` });
    }
  } catch (error) {
    return send(res, 500, { error: error.message });
  }
}
