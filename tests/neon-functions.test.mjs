import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildArticlePrompt,
  normalizeGeneratedArticle,
  parseRssItems,
  simpleHash,
  toArticleRow,
} from '../api/functions/_logic.js';

test('simpleHash returns a stable deterministic hash', () => {
  assert.equal(simpleHash('Fed cuts rates'), simpleHash('Fed cuts rates'));
  assert.notEqual(simpleHash('Fed cuts rates'), simpleHash('Fed hikes rates'));
});

test('parseRssItems extracts and decodes feed items', () => {
  const xml = `
    <rss><channel>
      <item>
        <title>Petrobras &amp; Vale sobem</title>
        <link>https://example.com/news</link>
        <description><![CDATA[Mercado reage &amp; investidores acompanham.]]></description>
        <pubDate>Fri, 29 May 2026 12:00:00 GMT</pubDate>
        <guid>abc-123</guid>
      </item>
    </channel></rss>
  `;

  const items = parseRssItems(xml);

  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Petrobras & Vale sobem');
  assert.equal(items[0].link, 'https://example.com/news');
  assert.equal(items[0].description, 'Mercado reage & investidores acompanham.');
  assert.equal(items[0].guid, 'abc-123');
});

test('normalizeGeneratedArticle removes raw URLs from body fields', () => {
  const normalized = normalizeGeneratedArticle({
    title: 'Teste',
    category: 'economia',
    what_happened: 'Segundo o BC https://example.com/a, o dado saiu.',
    why_it_matters: 'Veja [fonte](https://example.com/b) no fim.',
    impacts: { Bolsa: 'Neutro' },
    source_links: [{ name: 'Banco Central', url: 'https://example.com/a' }],
  });

  assert.equal(normalized.what_happened, 'Segundo o BC o dado saiu.');
  assert.equal(normalized.why_it_matters, 'Veja fonte no fim.');
  assert.deepEqual(normalized.impacts, { Bolsa: 'Neutro' });
  assert.deepEqual(normalized.source_links, [{ name: 'Banco Central', url: 'https://example.com/a' }]);
});

test('toArticleRow serializes JSON fields for Neon inserts', () => {
  const row = toArticleRow({
    title: 'Fed sinaliza corte',
    category: 'internacional',
    impacts: { Juros: 'Queda esperada' },
    source_links: [{ name: 'Fed', url: 'https://fed.example' }],
  }, {
    source_url: 'https://source.example',
    source_name: 'Fed',
  });

  assert.equal(row.title, 'Fed sinaliza corte');
  assert.equal(row.status, 'publicado');
  assert.deepEqual(row.impacts, { Juros: 'Queda esperada' });
  assert.deepEqual(row.source_links, [{ name: 'Fed', url: 'https://fed.example' }]);
  assert.equal(row.source_url, 'https://source.example');
});

test('toArticleRow normalizes AI enum fields for database constraints', () => {
  const row = toArticleRow({
    title: 'Mercado reage',
    category: 'bolsa',
    sentiment: 'positivo para ações',
    impact_level: 'médio',
    relevance: 'relevante',
    source_quality: 'confiável',
  });

  assert.equal(row.sentiment, 'positivo');
  assert.equal(row.impact_level, 'medio');
  assert.equal(row.relevance, 'media');
  assert.equal(row.source_quality, 'medium');
});

test('toArticleRow scales fractional AI confidence and auto-publishes strong articles', () => {
  const row = toArticleRow({
    title: 'Banco Central sinaliza juros estáveis',
    category: 'juros',
    ai_confidence: 0.92,
  });

  assert.equal(row.ai_confidence, 92);
  assert.equal(row.status, 'publicado');
});

test('buildArticlePrompt asks DeepSeek for long investor-grade articles', () => {
  const prompt = buildArticlePrompt({ raw_title: 'Fed mantém juros', source_name: 'Reuters' });

  assert.match(prompt, /900 a 1\.400 palavras/);
  assert.match(prompt, /what_happened: 4 a 6 parágrafos/);
  assert.match(prompt, /why_it_matters: 3 a 5 parágrafos/);
  assert.match(prompt, /conclusion: 2 a 3 parágrafos/);
});

test('normalizeGeneratedArticle converts AI arrays and objects into clean display text', () => {
  const article = normalizeGeneratedArticle({
    title: 'BCG e liderança',
    category: 'economia',
    key_takeaways: ['Primeiro ponto', 'Segundo ponto'],
    assets_to_watch: ['BCG', 'Consultorias'],
    affected_companies: [{ name: 'BCG', ticker: 'privada' }],
    tickers: ['BCG'],
  });

  assert.equal(article.key_takeaways, 'Primeiro ponto|Segundo ponto');
  assert.equal(article.assets_to_watch, 'BCG, Consultorias');
  assert.equal(article.affected_companies, 'BCG');
  assert.equal(article.tickers, 'BCG');
});
