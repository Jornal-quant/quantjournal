import { readFile, readdir } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

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
const sql = neon(databaseUrl);

function toSnakeCase(value) {
  return value.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`).replace(/^_/, '');
}

function normalizeValue(key, value) {
  if (JSON_FIELDS.has(key) && typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return key === 'impacts' ? {} : [];
    }
  }
  return value;
}

function normalizeRow(row) {
  const normalized = {};
  for (const [rawKey, value] of Object.entries(row)) {
    const key = toSnakeCase(rawKey);
    normalized[key] = normalizeValue(key, value);
  }
  if (normalized.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized.id)) {
    normalized.legacy_id = normalized.id;
    delete normalized.id;
  }
  if (normalized.article_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized.article_id)) {
    normalized.legacy_article_id = normalized.article_id;
    delete normalized.article_id;
  }
  return normalized;
}

async function insertRow(table, row) {
  const entries = Object.entries(row).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return;
  const columns = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  await sql.query(
    `insert into ${table} (${columns.join(', ')}) values (${placeholders.join(', ')}) on conflict do nothing`,
    values,
  );
}

const files = await readdir('exports').catch(() => []);
let total = 0;

for (const [entity, table] of Object.entries(TABLES)) {
  const fileName = `${entity}.json`;
  if (!files.includes(fileName)) continue;

  const rows = JSON.parse(await readFile(`exports/${fileName}`, 'utf8'));
  let imported = 0;
  for (const row of rows) {
    await insertRow(table, normalizeRow(row));
    imported += 1;
  }
  total += imported;
  console.log(`Imported ${imported} rows into ${table}`);
}

console.log(`Import complete: ${total} rows processed.`);
