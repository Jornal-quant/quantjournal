export const DEFAULT_RSS_SOURCES = [
  // Internacional
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', category: 'internacional', priority: 1 },
  { name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', category: 'internacional', priority: 1 },
  { name: 'CNBC Markets', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', category: 'internacional', priority: 1 },
  { name: 'Investing.com', url: 'https://www.investing.com/rss/news.rss', category: 'internacional', priority: 2 },
  { name: 'Google News · Markets', url: 'https://news.google.com/rss/search?q=stock+market+OR+economy+when:1d&hl=en-US&gl=US&ceid=US:en', category: 'internacional', priority: 2 },
  { name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'juros', priority: 1 },
  // Cripto
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'criptomoedas', priority: 2 },
  // Brasil
  { name: 'InfoMoney · Mercados', url: 'https://www.infomoney.com.br/mercados/feed/', category: 'bolsa', priority: 1 },
  { name: 'InfoMoney · Economia', url: 'https://www.infomoney.com.br/economia/feed/', category: 'economia', priority: 1 },
  { name: 'Money Times', url: 'https://www.moneytimes.com.br/feed/', category: 'bolsa', priority: 1 },
  { name: 'Brazil Journal', url: 'https://braziljournal.com/feed/', category: 'empresas', priority: 2 },
  { name: 'CNN Brasil · Economia', url: 'https://www.cnnbrasil.com.br/economia/feed/', category: 'economia', priority: 2 },
  { name: 'Agencia Brasil Economia', url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml', category: 'economia', priority: 2 },
  // Commodities (petróleo, ouro, agronegócio)
  { name: 'Google News · Commodities', url: 'https://news.google.com/rss/search?q=petr%C3%B3leo+OR+ouro+OR+commodities+OR+min%C3%A9rio+when:1d&hl=pt-BR&gl=BR&ceid=BR:pt-419', category: 'commodities', priority: 1 },
  { name: 'Notícias Agrícolas', url: 'https://www.noticiasagricolas.com.br/rss/noticias.xml', category: 'commodities', priority: 2 },
  { name: 'Google News · Agronegócio', url: 'https://news.google.com/rss/search?q=agroneg%C3%B3cio+OR+soja+OR+milho+OR+safra+when:1d&hl=pt-BR&gl=BR&ceid=BR:pt-419', category: 'commodities', priority: 2 },
  // Renda fixa (Tesouro Direto, juros, títulos)
  { name: 'Google News · Renda Fixa', url: 'https://news.google.com/rss/search?q=%22renda+fixa%22+OR+%22tesouro+direto%22+OR+CDB+OR+deb%C3%AAntures+when:1d&hl=pt-BR&gl=BR&ceid=BR:pt-419', category: 'renda_fixa', priority: 1 },
  { name: 'InfoMoney · Onde Investir', url: 'https://www.infomoney.com.br/onde-investir/feed/', category: 'renda_fixa', priority: 2 },
  { name: 'Google News · Tesouro e Juros', url: 'https://news.google.com/rss/search?q=%22tesouro+nacional%22+OR+%22curva+de+juros%22+OR+t%C3%ADtulos+p%C3%BAblicos+when:1d&hl=pt-BR&gl=BR&ceid=BR:pt-419', category: 'renda_fixa', priority: 2 },
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

// Conteúdo fora do escopo de mercado financeiro que algumas fontes (ex.: GNews
// category=business no Brasil) injetam — sobretudo resultados de loteria.
// Aplicado na coleta para não virar "análise de mercado" de sorteio.
export const IRRELEVANT_PATTERN = /\b(loteria|lotof[aá]cil|mega[ -]?sena|quina|timemania|lotomania|dupla[ -]?sena|dia de sorte|super[ -]?sete|milion[aá]ria|loteca|lotogol|sorteio|resultado da (?:lot|mega|quina|loteria)|concurso \d)\b/i;

export function isMarketRelevant(item = {}) {
  const haystack = `${item.title || ''} ${item.description || ''}`;
  return !IRRELEVANT_PATTERN.test(haystack);
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
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')    // colapsa espaços/tabs MAS preserva as quebras de parágrafo
    .replace(/ ?\n ?/g, '\n')   // remove espaços ao redor das quebras
    .replace(/\n{3,}/g, '\n\n') // no máximo um parágrafo em branco entre blocos
    .replace(/ +\./g, '.')
    .trim();
}

function normalizeConfidence(value) {
  const confidence = Number(value || 70);
  if (!Number.isFinite(confidence)) return 70;
  const scaled = confidence > 0 && confidence <= 1 ? confidence * 100 : confidence;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

function stringifyList(value, separator = ', ') {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item == null) return '';
        if (typeof item === 'object') return item.name || item.ticker || item.symbol || item.title || '';
        return String(item);
      })
      .map((item) => cleanArticleText(item))
      .filter(Boolean)
      .join(separator);
  }

  if (value && typeof value === 'object') {
    return cleanArticleText(value.name || value.ticker || value.symbol || Object.values(value).filter(Boolean).join(' '));
  }

  return cleanArticleText(value || '');
}

export function articleWordCount(article = {}) {
  return [
    article.summary,
    article.what_happened,
    article.why_it_matters,
    article.conclusion,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
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
    affected_companies: stringifyList(article.affected_companies),
    tickers: stringifyList(article.tickers),
    investor_summary: stringifyList(article.investor_summary, '|'),
    key_takeaways: stringifyList(article.key_takeaways, '|'),
    assets_to_watch: stringifyList(article.assets_to_watch),
    tags: stringifyList(article.tags),
    impacts: article.impacts && typeof article.impacts === 'object' ? article.impacts : {},
    source_links: sourceLinks,
    ai_confidence: normalizeConfidence(article.ai_confidence),
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

export function buildArticlePrompt(rawItem = {}, context = {}) {
  const marketBlock = context.marketContext
    ? `\nCONTEXTO DE MERCADO ATUAL (números reais coletados pelo nosso portal — use quando relevantes para a análise; NÃO invente outros valores):\n${context.marketContext}\n`
    : '';
  const sources = Array.isArray(context.additionalSources) ? context.additionalSources : [];
  const sourcesBlock = sources.length
    ? `\nFONTES ADICIONAIS sobre o MESMO tema (apure e SINTETIZE todas em UMA matéria única e original; não reproduza a redação de nenhuma):\n${sources
        .map((s, i) => `Fonte ${i + 2} (${s.source_name || 'não identificada'}): "${s.raw_title}" — ${String(s.raw_content || '').replace(/\s+/g, ' ').slice(0, 700)}`)
        .join('\n')}\n`
    : '';
  return `Você é editor-chefe de um portal financeiro profissional. Escreva em português brasileiro, com precisão jornalística e foco no investidor.

REGRAS:
- Gere uma matéria longa, densa e útil. O mínimo absoluto de 1.200 palavras deve ser respeitado; o alvo ideal é 1.600 a 2.200 palavras no total.
- Nunca inclua URLs brutas no corpo do texto.
- Cite fontes de forma natural, como "segundo a Reuters" ou "conforme o Banco Central".
- Separe fatos de interpretação.
- Evite linguagem genérica e repetitiva.
- Não faça recomendação de compra ou venda.

ORIGINALIDADE (evitar direitos autorais):
- Reescreva TUDO com palavras próprias. NÃO copie frases, títulos ou trechos literais da notícia original — reproduza apenas os fatos (números, datas, nomes), nunca a redação.
- Crie um título original e diferente do título da fonte.
- Reorganize a ordem das informações e a estrutura; não siga a sequência da matéria original.
- Acrescente análise, contexto e interpretação próprios que vão além do texto de origem, para que o resultado seja claramente uma obra transformadora, não uma cópia.
- Quando houver "CONTEXTO DE MERCADO ATUAL" e/ou "FONTES ADICIONAIS" abaixo, incorpore esses dados reais e sintetize as fontes numa apuração própria — isso torna a matéria genuinamente original e ancorada em dados, em vez de derivada de um único texto.
- Não escreva texto curto. Se a notícia original for simples, amplie com contexto setorial, histórico recente, impactos prováveis, riscos e próximos indicadores a observar.
- Use parágrafos completos, com análise objetiva e linguagem de portal financeiro profissional.

TAMANHO MÍNIMO DOS CAMPOS:
- summary: 100 a 150 palavras em 3 a 4 frases completas.
- what_happened: 650 a 900 palavras, em 6 a 9 parágrafos separados por "\\n\\n".
- why_it_matters: 550 a 800 palavras, em 5 a 8 parágrafos separados por "\\n\\n".
- conclusion: 250 a 380 palavras, em 3 a 4 parágrafos separados por "\\n\\n".
- investor_summary: 3 bullets separados por "|".
- key_takeaways: 4 bullets separados por "|".
- assets_to_watch: lista separada por vírgula.
- affected_companies e tickers: listas separadas por vírgula, nunca objetos JSON.
- Antes de retornar, confira mentalmente: se a soma de summary + what_happened + why_it_matters + conclusion tiver menos de 1.200 palavras, expanda a análise.

${marketBlock}${sourcesBlock}
Notícia original (fonte principal):
Título: "${rawItem.raw_title}"
Conteúdo: ${rawItem.raw_content || '(use o título e contexto público para complementar)'}
Fonte: ${rawItem.source_name || 'Não identificada'}
URL: ${rawItem.source_url || ''}

Retorne somente JSON com:
title, slug, summary, what_happened, why_it_matters, impacts, affected_companies, tickers, conclusion, investor_summary, key_takeaways, assets_to_watch, source_links, tags, meta_title, meta_description, social_summary, category, sentiment, impact_level, relevance, country, sector, source, ai_confidence.`;
}

export function buildArticleExpansionPrompt(article = {}, rawItem = {}) {
  return `Você é editor-chefe de um portal financeiro profissional. Sua tarefa é reescrever e expandir uma matéria curta para o padrão de matéria grande, com análise profunda para investidores.

OBJETIVO:
- Transformar o texto atual em uma matéria completa, com mínimo obrigatório de 1.400 palavras e alvo de 1.800 a 2.400 palavras.
- não resuma. Amplie com contexto, dados setoriais, implicações, riscos, cenários e pontos de monitoramento.
- Preserve os fatos conhecidos. Não invente números específicos que não estejam no texto original.
- Separe fato de interpretação.
- Não faça recomendação de compra ou venda.
- Não inclua URLs brutas no corpo do texto.
- ORIGINALIDADE: reescreva com palavras próprias, sem copiar frases ou o título da fonte. Reproduza só os fatos, nunca a redação original; o resultado deve ser uma obra transformadora.

TAMANHO POR CAMPO:
- summary: 120 a 180 palavras.
- what_happened: 750 a 1.000 palavras, em 7 a 10 parágrafos separados por "\\n\\n".
- why_it_matters: 650 a 900 palavras, em 6 a 9 parágrafos separados por "\\n\\n".
- conclusion: 280 a 420 palavras, em 3 a 5 parágrafos separados por "\\n\\n".
- investor_summary: 3 bullets densos separados por "|".
- key_takeaways: 5 bullets separados por "|".
- assets_to_watch, affected_companies e tickers: listas separadas por vírgula, nunca objetos JSON.

Notícia original:
Título: "${rawItem.raw_title || article.title || ''}"
Conteúdo base: ${rawItem.raw_content || ''}
Fonte: ${rawItem.source_name || article.source || 'Não identificada'}

Matéria curta atual:
${JSON.stringify(article)}

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
