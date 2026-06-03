// Postagem no X (Twitter) — API v2 POST /2/tweets com assinatura OAuth 1.0a
// feita à mão com `node:crypto` (HMAC-SHA1), sem dependências externas.
//
// Envs necessárias (4 credenciais do app do X, permissão Write):
//   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
import { createHmac, randomBytes } from 'node:crypto';

// Percent-encode no padrão RFC 3986 (mais estrito que encodeURIComponent).
function pe(str) {
  return encodeURIComponent(String(str)).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function hasXCredentials() {
  return Boolean(
    process.env.X_API_KEY &&
    process.env.X_API_SECRET &&
    process.env.X_ACCESS_TOKEN &&
    process.env.X_ACCESS_SECRET,
  );
}

// Posta um tweet de texto. Retorna { ok, id } ou { ok:false, status, error }.
export async function postTweet(text) {
  if (!hasXCredentials()) {
    return { ok: false, skipped: true, reason: 'missing_credentials' };
  }

  const consumerKey = process.env.X_API_KEY;
  const consumerSecret = process.env.X_API_SECRET;
  const token = process.env.X_ACCESS_TOKEN;
  const tokenSecret = process.env.X_ACCESS_SECRET;
  const url = 'https://api.twitter.com/2/tweets';

  const oauth = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: token,
    oauth_version: '1.0',
  };

  // Para corpo application/json, a base de assinatura inclui apenas os params
  // oauth_* (e query params, que aqui não existem) — não o JSON.
  const paramString = Object.keys(oauth)
    .sort()
    .map((k) => `${pe(k)}=${pe(oauth[k])}`)
    .join('&');
  const baseString = `POST&${pe(url)}&${pe(paramString)}`;
  const signingKey = `${pe(consumerSecret)}&${pe(tokenSecret)}`;
  const signature = createHmac('sha1', signingKey).update(baseString).digest('base64');

  const header = `OAuth ${Object.keys({ ...oauth, oauth_signature: signature })
    .sort()
    .map((k) => `${pe(k)}="${pe(k === 'oauth_signature' ? signature : oauth[k])}"`)
    .join(', ')}`;

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: header, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(12000),
    });
  } catch (err) {
    return { ok: false, status: 0, error: `network: ${err.message}` };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.title || data?.errors?.[0]?.message || JSON.stringify(data).slice(0, 200);
    return { ok: false, status: res.status, error };
  }
  return { ok: true, id: data?.data?.id };
}
