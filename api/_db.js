import { neon } from '@neondatabase/serverless';

const TABLES = {
  Article: 'qj_articles',
  RawNewsFeed: 'qj_raw_news_feed',
  NewsSource: 'qj_news_sources',
  MarketSnapshot: 'qj_market_snapshots',
  NewsletterSubscriber: 'qj_newsletter_subscribers',
  SystemLog: 'qj_system_logs',
  AssetPage: 'qj_asset_pages',
  ChatConversation: 'qj_chat_conversations',
};

const JSON_FIELDS = new Set(['impacts', 'source_links', 'messages']);

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }
  return neon(process.env.DATABASE_URL);
}

export function tableFor(entity) {
  const table = TABLES[entity];
  if (!table) {
    throw new Error(`Unsupported entity: ${entity}`);
  }
  return table;
}

export function normalizeRow(row) {
  if (!row) return row;
  const out = { ...row };
  for (const field of JSON_FIELDS) {
    if (field in out && out[field] != null && typeof out[field] !== 'string') {
      out[field] = JSON.stringify(out[field]);
    }
  }
  return out;
}

export function normalizeRows(rows) {
  return rows.map(normalizeRow);
}

export function toDatabasePayload(payload = {}) {
  const out = { ...payload };
  for (const field of JSON_FIELDS) {
    if (!(field in out) || out[field] == null) continue;

    if (typeof out[field] === 'string') {
      try {
        out[field] = JSON.stringify(JSON.parse(out[field]));
      } catch {
        out[field] = field === 'source_links' || field === 'messages' ? '[]' : '{}';
      }
    } else {
      out[field] = JSON.stringify(out[field]);
    }
  }
  return out;
}

export function parseOrder(order) {
  if (!order) return { column: 'created_date', direction: 'desc' };
  const direction = order.startsWith('-') ? 'desc' : 'asc';
  const column = order.replace(/^-/, '');
  return { column, direction };
}

export function sendJson(res, status, data) {
  res.statusCode = status;
  // CORS: permitir chamadas do front-end (mesmo host) e de origens externas quando necessário
  // Usamos '*' para simplificar, ajustar se quiser restringir origens.
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.end(JSON.stringify(data));
}

// Requisição autenticada como admin: header x-admin-token (ou Bearer) igual ao
// ADMIN_TOKEN do servidor. Usado para proteger escrita/funções administrativas.
export function isAdminRequest(req) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const headers = req.headers || {};
  const provided = headers['x-admin-token'] || String(headers.authorization || '').replace(/^Bearer\s+/i, '');
  return provided === token;
}

// Requisição vinda do próprio site (browser): Origin/Referer com o mesmo host.
// Bloqueia abuso direto (curl/scripts sem Origin) de endpoints caros como a IA.
export function isSameOriginRequest(req) {
  const headers = req.headers || {};
  const host = headers['x-forwarded-host'] || headers.host || '';
  const ref = headers.origin || headers.referer || '';
  if (!ref || !host) return false;
  try {
    return new URL(ref).host === host;
  } catch {
    return false;
  }
}
