import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('deepseek smoke script is safe to run without exposing secrets', async () => {
  const script = await readFile(new URL('../scripts/smoke-deepseek-analysis.mjs', import.meta.url), 'utf8');

  assert.match(script, /DEEPSEEK_API_KEY/);
  assert.match(script, /process\.env\.DEEPSEEK_API_KEY/);
  assert.doesNotMatch(script, /console\.(log|error)\([^)]*apiKey/);
  assert.doesNotMatch(script, /sk-[a-zA-Z0-9]/);
});

test('deepseek smoke script sanitizes provider error output', async () => {
  const script = await readFile(new URL('../scripts/smoke-deepseek-analysis.mjs', import.meta.url), 'utf8');

  assert.match(script, /sanitizeProviderError/);
  assert.doesNotMatch(script, /errorText\.slice/);
});
