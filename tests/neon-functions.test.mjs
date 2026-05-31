import test from 'node:test';
import assert from 'node:assert/strict';

import {
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
