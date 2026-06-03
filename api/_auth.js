// Autenticação de usuários (modo Neon/Vercel). Sem dependências externas:
// usa apenas `node:crypto`. Senhas com scrypt; sessão num token HMAC assinado
// guardado em cookie HttpOnly. Mesmo host do front → cookie same-origin, sem CORS.
import { randomBytes, scryptSync, timingSafeEqual, createHmac, createHash, randomUUID } from 'node:crypto';

export const SESSION_COOKIE = 'qj_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias
export const RESET_TTL_SECONDS = 60 * 60; // 1 hora

function sessionSecret() {
  const s = process.env.AUTH_SESSION_SECRET || process.env.ADMIN_TOKEN;
  if (!s) throw new Error('AUTH_SESSION_SECRET (ou ADMIN_TOKEN) não configurado no servidor.');
  return s;
}

const isProd = () => process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

// ---------- Senha (scrypt) ----------
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(password), salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'hex');
  const expected = Buffer.from(parts[2], 'hex');
  let actual;
  try {
    actual = scryptSync(String(password), salt, expected.length);
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ---------- Token de reset (guardamos só o hash) ----------
export function newResetToken() {
  const raw = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashResetToken(raw) {
  return createHash('sha256').update(String(raw)).digest('hex');
}

// ---------- Sessão (token HMAC: <payloadB64>.<sigB64>) ----------
function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(str) {
  return Buffer.from(String(str).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export function signSession(payload) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const data = b64url(JSON.stringify(body));
  const sig = b64url(createHmac('sha256', sessionSecret()).update(data).digest());
  return `${data}.${sig}`;
}

export function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = b64url(createHmac('sha256', sessionSecret()).update(data).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(fromB64url(data).toString('utf8'));
  } catch {
    return null;
  }
  if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// ---------- Cookies ----------
export function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function sessionCookie(token) {
  const secure = isProd() ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function clearSessionCookie() {
  const secure = isProd() ? '; Secure' : '';
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

export function getSessionUser(req) {
  const cookies = parseCookies(req);
  return verifySession(cookies[SESSION_COOKIE]);
}

export { randomUUID };
