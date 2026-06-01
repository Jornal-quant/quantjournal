import { isAdminRequest, isSameOriginRequest, sendJson } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  // Endpoint custoso (DeepSeek): só do próprio site (browser) ou admin.
  // Bloqueia chamadas diretas (curl/bots) que torrariam créditos.
  if (!isSameOriginRequest(req) && !isAdminRequest(req)) {
    return sendJson(res, 403, { error: 'Origem não autorizada.' });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return sendJson(res, 500, { error: 'DEEPSEEK_API_KEY is not configured.' });
    }

    const { prompt, response_json_schema: schema, quality = false } = req.body || {};
    if (!prompt) {
      return sendJson(res, 400, { error: 'prompt is required.' });
    }

    const model = quality
      ? process.env.DEEPSEEK_QUALITY_MODEL || 'deepseek-reasoner'
      : process.env.DEEPSEEK_CHEAP_MODEL || 'deepseek-chat';

    const timeoutMs = Number(process.env.DEEPSEEK_TIMEOUT_MS || 45000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch(`${process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'}/chat/completions`, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: schema ? { type: 'json_object' } : undefined,
          temperature: 0.3,
          max_tokens: schema ? 8000 : 3000,
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const text = await response.text();
      return sendJson(res, response.status, { error: text });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (schema) {
      try {
        return sendJson(res, 200, JSON.parse(content));
      } catch {
        return sendJson(res, 502, { error: 'AI response was not valid JSON.', content });
      }
    }

    return sendJson(res, 200, { result: content });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return sendJson(res, 504, { error: 'DeepSeek demorou demais para responder. Tente novamente.' });
    }
    return sendJson(res, 500, { error: error.message });
  }
}
