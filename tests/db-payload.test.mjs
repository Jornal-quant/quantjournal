import test from 'node:test';
import assert from 'node:assert/strict';

import { toDatabasePayload } from '../api/_db.js';

test('toDatabasePayload serializes JSON fields as valid JSON strings', () => {
  const payload = toDatabasePayload({
    impacts: { Bolsa: 'positivo' },
    source_links: [{ name: 'Fonte', url: 'https://example.com' }],
  });

  assert.equal(payload.impacts, '{"Bolsa":"positivo"}');
  assert.equal(payload.source_links, '[{"name":"Fonte","url":"https://example.com"}]');
});

test('toDatabasePayload replaces invalid JSON field strings with safe defaults', () => {
  const payload = toDatabasePayload({
    impacts: 'texto livre',
    source_links: 'links livres',
  });

  assert.equal(payload.impacts, '{}');
  assert.equal(payload.source_links, '[]');
});
