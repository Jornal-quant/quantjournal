export const DEFAULT_RSS_SOURCES = [
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', category: 'internacional', priority: 1 },
  { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', category: 'internacional', priority: 1 },
  { name: 'CNBC Markets', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'internacional', priority: 1 },
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'criptomoedas', priority: 2 },
  { name: 'Agencia Brasil Economia', url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml', category: 'economia', priority: 2 },
  { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'juros', priority: 1 },
];

export const BACKFILL_TOPICS = [
  { topic: 'Ibovespa hoje e os principais fatores que movem a bolsa brasileira', category: 'bolsa' },
  { topic: 'Petrobras, dividendos e impacto do petróleo para investidores brasileiros', category: 'empresas' },
  { topic: 'Vale, minério de ferro e demanda da China', category: 'empresas' },
  { topic: 'Dólar frente ao real e fluxo para mercados emergentes', category: 'dolar' },
  { topic: 'Selic, Copom e impactos na renda fixa', category: 'juros' },
  { topic: 'IPCA, inflação de serviços e política monetária no Brasil', category: 'economia' },
  { topic: 'Federal Reserve, juros americanos e impacto global', category: 'internacional' },
  { topic: 'Bitcoin, ETFs e adoção institucional de criptoativos', category: 'criptomoedas' },
  { topic: 'Petróleo, OPEP e impactos em commodities', category: 'commodities' },
  { topic: 'Tesouro Direto, curva de juros e oportunidade em renda fixa', category: 'renda_fixa' },
];

const CATEGORIES = new Set([
  'bolsa',
  'renda_fixa',
  'juros',
  'dolar',
  'economia',
  'criptomoedas',
  'commodities',
  'empresas',
  'internacional',
]);

const SENTIMENTS = new Set(['positivo', 'negativo', 'neutro', 'misto']);
const IMPACT_LEVELS = new Set(['baixo', 'medio', 'alto', 'critico']);
const SOURCE_QUALITIES = new Set(['low', 'medium', 'high']);
const RELEVANCES = new Set(['baixa', 'media', 'alta', 'urgente']);

function normalizeEnum(value, allowed, fallback, aliases = {}) {
  const normalized = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (allowed.has(normalized)) return normalized;
  if (aliases[normalized]) return aliases[normalized];

  for (const item of allowed) {
    if (normalized.includes(item)) return item;
  }

  for (const [alias, target] of Object.entries(aliases)) {
    if (normalized.includes(alias)) return target;
  }

  return fallback;
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTagValue(itemXml, tag) {
  const match = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return decodeHtml(match?.[1] || '');
}

export function simpleHash(input = '') {
  let hash = 0;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function parseRssItems(xml = '') {
  const items = [];
  const itemMatches = String(xml).match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const title = getTagValue(itemXml, 'title');
    const link = getTagValue(itemXml, 'link');
    const description = getTagValue(itemXml, 'description') || getTagValue(itemXml, 'summary');
    const pubDate = getTagValue(itemXml, 'pubDate') || getTagValue(itemXml, 'published');
    const guid = getTagValue(itemXml, 'guid') || link;

    if (title && link) {
      items.push({ title, link, description, pubDate, guid });
    }
  }

  return items.slice(0, 25);
}

export function cleanArticleText(text = '') {
  return String(text)
    .replace(/\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeGeneratedArticle(article = {}) {
  const category = CATEGORIES.has(article.category) ? article.category : 'economia';
  const sourceLinks = Array.isArray(article.source_links)
    ? article.source_links.filter((source) => source?.name)
    : [];

  return {
    ...article,
    category,
    sentiment: normalizeEnum(article.sentiment, SENTIMENTS, 'neutro'),
    impact_level: normalizeEnum(article.impact_level, IMPACT_LEVELS, 'medio', {
      medio: 'medio',
      medio_impacto: 'medio',
      moderate: 'medio',
      medium: 'medio',
      high: 'alto',
      critical: 'critico',
      baixo_impacto: 'baixo',
      low: 'baixo',
    }),
    relevance: normalizeEnum(article.relevance, RELEVANCES, 'media', {
      medio: 'media',
      relevante: 'media',
      important: 'alta',
      high: 'alta',
      breaking: 'urgente',
      urgent: 'urgente',
      low: 'baixa',
    }),
    source_quality: normalizeEnum(article.source_quality, SOURCE_QUALITIES, 'medium', {
      confiavel: 'medium',
      alta: 'high',
      baixa: 'low',
    }),
    title: cleanArticleText(article.title || 'Análise de mercado'),
    summary: cleanArticleText(article.summary || ''),
    what_happened: cleanArticleText(article.what_happened || ''),
    why_it_matters: cleanArticleText(article.why_it_matters || ''),
    conclusion: cleanArticleText(article.conclusion || ''),
    impacts: article.impacts && typeof article.impacts === 'object' ? article.impacts : {},
    source_links: sourceLinks,
    ai_confidence: Number(article.ai_confidence || 70),
  };
}

export function toArticleRow(generatedArticle = {}, rawItem = {}) {
  const article = normalizeGeneratedArticle(generatedArticle);
  const confidence = article.ai_confidence || 70;
  const autoPublish = confidence >= 65;

  return {
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    what_happened: article.what_happened,
    why_it_matters: article.why_it_matters,
    impacts: article.impacts || {},
    affected_companies: article.affected_companies || '',
    tickers: article.tickers || '',
    conclusion: article.conclusion || '',
    investor_summary: article.investor_summary || '',
    assets_to_watch: article.assets_to_watch || '',
    source_links: article.source_links || [],
    key_takeaways: article.key_takeaways || '',
    sentiment: article.sentiment || 'neutro',
    impact_level: article.impact_level || 'medio',
    category: article.category,
    tags: article.tags || '',
    source: article.source || rawItem.source_name || 'Fonte externa',
    source_url: rawItem.source_url || article.source_url || '',
    image_url: article.image_url || '',
    meta_title: article.meta_title || article.title,
    meta_description: article.meta_description || article.summary,
    social_summary: article.social_summary || article.summary,
    ai_confidence: confidence,
    source_quality: article.source_quality || 'medium',
    relevance: article.relevance || 'media',
    country: article.country || '',
    sector: article.sector || '',
    status: autoPublish ? 'publicado' : 'revisao',
    is_featured: autoPublish && ['alta', 'urgente'].includes(article.relevance),
    is_breaking: article.relevance === 'urgente',
    premium_only: false,
    views: 0,
  };
}

export function buildArticlePrompt(rawItem = {}) {
  return `Você é editor-chefe de um portal financeiro profissional. Escreva em português brasileiro, com precisão jornalística e foco no investidor.

REGRAS:
- Nunca inclua URLs brutas no corpo do texto.
- Cite fontes de forma natural, como "segundo a Reuters" ou "conforme o Banco Central".
- Separe fatos de interpretação.
- Evite linguagem genérica e repetitiva.
- Não faça recomendação de compra ou venda.

Notícia original:
Título: "${rawItem.raw_title}"
Conteúdo: ${rawItem.raw_content || '(use o título e contexto público para complementar)'}
Fonte: ${rawItem.source_name || 'Não identificada'}
URL: ${rawItem.source_url || ''}

Retorne somente JSON com:
title, slug, summary, what_happened, why_it_matters, impacts, affected_companies, tickers, conclusion, investor_summary, key_takeaways, assets_to_watch, source_links, tags, meta_title, meta_description, social_summary, category, sentiment, impact_level, relevance, country, sector, source, ai_confidence.`;
}

export function buildNewsletterPrompt(articles = []) {
  const list = articles
    .slice(0, 8)
    .map((article, index) => `${index + 1}. ${article.title}\n${article.summary || ''}`)
    .join('\n\n');

  return `Crie uma newsletter financeira diária em HTML simples, profissional e responsiva.

Notícias:
${list}

Inclua: saudação, principais notícias, "o que monitorar hoje" com 3 pontos, e disclaimer de que não é recomendação de investimento.`;
}
