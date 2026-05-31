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
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
