import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

import { buildArticlePrompt, normalizeGeneratedArticle } from '../api/functions/_logic.js';

async function loadLocalEnv() {
  const envPath = new URL('../.env.local', import.meta.url);
  if (!existsSync(envPath)) return;

  const envFile = await readFile(envPath, 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (process.env[key]) continue;

    process.env[key] = valueParts.join('=').replace(/^['"]|['"]$/g, '');
  }
}

function requireDeepSeekKey() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY não está configurada. Gere uma chave nova e coloque em .env.local ou no ambiente do comando.');
    process.exit(1);
  }

  return apiKey;
}

function sanitizeProviderError(text = '') {
  return String(text)
    .replace(/sk-[a-zA-Z0-9_-]+/g, '[redacted-key]')
    .replace(/api key:\s*[^",}]+/gi, 'api key: [redacted]')
    .slice(0, 500);
}

async function main() {
  await loadLocalEnv();
  const apiKey = requireDeepSeekKey();
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_CHEAP_MODEL || 'deepseek-chat';

  const prompt = buildArticlePrompt({
    raw_title: 'Ibovespa fecha em alta com bancos e commodities enquanto investidores monitoram juros',
    raw_content: 'Mercado brasileiro avançou em dia de melhora no apetite por risco. Analistas acompanham a curva de juros e o dólar.',
    source_name: 'Smoke test interno',
    source_url: 'https://example.com/smoke-test',
  });

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.25,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek respondeu ${response.status}: ${sanitizeProviderError(errorText)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  const article = normalizeGeneratedArticle(JSON.parse(content));

  console.log('DeepSeek conectado e gerando análise.');
  console.log(`Modelo: ${model}`);
  console.log(`Título: ${article.title}`);
  console.log(`Categoria: ${article.category}`);
  console.log(`Confiança IA: ${article.ai_confidence}`);
  console.log(`Tem impactos: ${Object.keys(article.impacts || {}).length > 0 ? 'sim' : 'não'}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
