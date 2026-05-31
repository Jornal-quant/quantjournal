import { sendJson } from '../_db.js';

export default async function handler(req, res) {
  const name = req.query.name;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  return sendJson(res, 501, {
    error: `Function "${name}" is not implemented in the Neon/Vercel runtime yet.`,
    migration_note: 'Database-backed entity operations and DeepSeek invocation are ready. Port Base44 functions into this route one by one.',
  });
}
