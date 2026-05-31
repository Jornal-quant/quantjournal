import { mkdir, writeFile } from 'node:fs/promises';
import { createClient } from '@base44/sdk';

const appId = process.env.VITE_BASE44_APP_ID || process.env.BASE44_APP_ID;
const token = process.env.BASE44_ACCESS_TOKEN || process.env.VITE_BASE44_ACCESS_TOKEN;
const appBaseUrl = process.env.VITE_BASE44_APP_BASE_URL || process.env.BASE44_APP_BASE_URL;

if (!appId) {
  console.error('BASE44_APP_ID or VITE_BASE44_APP_ID is required.');
  process.exit(1);
}

const base44 = createClient({
  appId,
  token,
  appBaseUrl,
  requiresAuth: false,
});

const entities = [
  'Article',
  'RawNewsFeed',
  'NewsSource',
  'MarketSnapshot',
  'NewsletterSubscriber',
  'SystemLog',
  'AssetPage',
  'ChatConversation',
];

await mkdir('exports', { recursive: true });

for (const entity of entities) {
  const client = base44.entities?.[entity];
  if (!client?.list) {
    console.warn(`Skipping ${entity}: entity client not available.`);
    continue;
  }

  const rows = await client.list('-created_date', 1000);
  const path = `exports/${entity}.json`;
  await writeFile(path, `${JSON.stringify(rows, null, 2)}\n`);
  console.log(`Exported ${rows.length} rows: ${path}`);
}
