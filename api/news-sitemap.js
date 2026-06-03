import { getSql } from './_db.js';

// Sitemap específico do Google News: apenas matérias das últimas 48h, com as
// tags <news:news> (nome da publicação, idioma, data e título). É isso que o
// Google News usa para descobrir notícias novas rapidamente.
// Exposto em /news-sitemap.xml (ver rewrite no vercel.json).

const PUBLICATION_NAME = 'Capital Times';
const LANGUAGE = 'pt';

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.capitaltimes.com.br';
  const base = `https://${host}`;

  let articles = [];
  try {
    const sql = getSql();
    articles = await sql.query(
      `select id, slug, title, created_date
         from qj_articles
        where status = 'publicado'
          and created_date > now() - interval '48 hours'
        order by created_date desc
        limit 1000`,
    );
  } catch {
    // sem DB: devolve sitemap vazio (mas válido).
  }

  const items = articles.map((a) => {
    const slug = a.slug || a.id;
    const loc = `${base}/artigo/${encodeURIComponent(slug)}`;
    const pubDate = a.created_date ? new Date(a.created_date).toISOString() : new Date().toISOString();
    return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(PUBLICATION_NAME)}</news:name>
        <news:language>${LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${xmlEscape(a.title || '')}</news:title>
    </news:news>
  </url>`;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items.join('\n')}
</urlset>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
  res.end(body);
}
