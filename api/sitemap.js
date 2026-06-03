import { getSql } from './_db.js';

const STATIC_PATHS = ['/', '/ativos', '/busca', '/metodologia', '/chat'];
const CATEGORIES = ['bolsa', 'renda_fixa', 'juros', 'dolar', 'economia', 'criptomoedas', 'commodities', 'empresas', 'internacional'];

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.capitaltimes.com.br';
  const base = `https://${host}`;

  let articles = [];
  try {
    const sql = getSql();
    articles = await sql.query(
      `select id, slug, updated_date from qj_articles where status = 'publicado' order by created_date desc limit 1000`,
    );
  } catch {
    // sem DB ainda assim devolve as páginas estáticas
  }

  const urls = [];
  for (const p of STATIC_PATHS) urls.push({ loc: `${base}${p}`, priority: p === '/' ? '1.0' : '0.6' });
  for (const c of CATEGORIES) urls.push({ loc: `${base}/categoria/${c}`, priority: '0.6' });
  for (const a of articles) {
    const slug = a.slug || a.id;
    urls.push({
      loc: `${base}/artigo/${encodeURIComponent(slug)}`,
      lastmod: a.updated_date ? new Date(a.updated_date).toISOString() : undefined,
      priority: '0.8',
    });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.end(body);
}
