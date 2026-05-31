import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const migrationPath = new URL('../migrations/001_quantjournal_neon_schema.sql', import.meta.url);
const migrationSql = await readFile(migrationPath, 'utf8');
const sql = neon(databaseUrl);

function splitSqlStatements(source) {
  const statements = [];
  let current = '';
  let dollarQuote = null;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const rest = source.slice(i);
    const dollarMatch = rest.match(/^\$[a-zA-Z0-9_]*\$/);

    if (dollarMatch) {
      const tag = dollarMatch[0];
      current += tag;
      i += tag.length - 1;
      dollarQuote = dollarQuote === tag ? null : tag;
      continue;
    }

    if (char === ';' && !dollarQuote) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = '';
      continue;
    }

    current += char;
  }

  const trailing = current.trim();
  if (trailing) statements.push(trailing);
  return statements;
}

for (const statement of splitSqlStatements(migrationSql)) {
  await sql.query(statement);
}

console.log('Neon schema applied: migrations/001_quantjournal_neon_schema.sql');
