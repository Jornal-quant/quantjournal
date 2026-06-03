import { getSql, isAdminRequest, normalizeRow, sendJson, toDatabasePayload } from '../_db.js';
import {
  BACKFILL_TOPICS,
  DEFAULT_RSS_SOURCES,
  articleWordCount,
  buildArticleExpansionPrompt,
  buildArticlePrompt,
  buildNewsletterPrompt,
  isMarketRelevant,
  normalizeGeneratedArticle,
  parseRssItems,
  simpleHash,
  toArticleRow,
} from './_logic.js';
import { postTweet, hasXCredentials } from '../_x.js';

const MIN_ARTICLE_WORDS = 1200;
const EXPANSION_ATTEMPTS = 2;

const SANITY = {
  IBOV: [50000, 400000],
  SPX: [1000, 20000],
  'USD/BRL': [1, 20],
  'EUR/BRL': [1, 25],
  BTC: [1000, 1000000],
  ETH: [50, 100000],
  SELIC: [0.01, 30],
  GOLD: [500, 15000],
  OIL: [5, 250],
};

async function insertRow(sql, table, payload) {
  const row = toDatabasePayload(payload);
  const entries = Object.entries(row).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  const result = await sql.query(
    `insert into ${table} (${columns.join(', ')}) values (${placeholders.join(', ')}) returning *`,
    values,
  );
  return normalizeRow(result[0]);
}

const TITLE_STOPWORDS = new Set(['para', 'pelo', 'pela', 'com', 'que', 'dos', 'das', 'uma', 'ent', 'ano', 'hoje', 'sobre', 'apos', 'mais', 'menos', 'entre', 'como', 'pode', 'tem']);

function titleKeywords(title) {
  return new Set(
    String(title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !TITLE_STOPWORDS.has(w)),
  );
}

// Detecta matérias quase iguais (mesma categoria, últimas 36h) por sobreposição
// de palavras-chave do título — pega variações como "alívio externo e cautela
// fiscal" vs "alívio fiscal e cautela externa" que o dedup exato não pegava.
async function isDuplicatePublished(sql, row) {
  const kw = titleKeywords(row.title);
  if (kw.size < 3) return false;
  const recent = await sql.query(
    `select title from qj_articles where status = 'publicado' and category = $1 and created_date > now() - interval '36 hours' order by created_date desc limit 40`,
    [row.category],
  );
  for (const other of recent) {
    const otherKw = titleKeywords(other.title);
    if (otherKw.size === 0) continue;
    let inter = 0;
    for (const w of kw) if (otherKw.has(w)) inter += 1;
    if (inter / Math.min(kw.size, otherKw.size) >= 0.6) return true;
  }
  return false;
}

async function insertArticle(sql, payload, seed = '') {
  const row = { ...payload };
  // Evita publicar duplicata recente no feed: mantém para revisão em vez de publicar.
  if (row.status === 'publicado' && (await isDuplicatePublished(sql, row).catch(() => false))) {
    row.status = 'revisao';
    row.is_featured = false;
    row.is_breaking = false;
  }
  const slugSource = row.slug || row.title || 'analise-mercado';
  const baseSlug = String(slugSource)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'analise-mercado';

  row.slug = baseSlug;
  const existing = await sql.query(`select id from qj_articles where slug = $1 limit 1`, [row.slug]);
  if (existing.length > 0) {
    row.slug = `${baseSlug}-${simpleHash(`${seed}:${row.title}:${Date.now()}`).slice(0, 6)}`;
  }

  return insertRow(sql, 'qj_articles', row);
}

async function updateRow(sql, table, id, payload) {
  const row = toDatabasePayload(payload);
  const entries = Object.entries(row).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return null;
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`);
  values.push(id);
  const result = await sql.query(
    `update ${table} set ${assignments.join(', ')} where id = $${values.length} returning *`,
    values,
  );
  return normalizeRow(result[0]);
}

async function logSystem(sql, action, details, logType = 'info', source = 'vercel-functions') {
  await insertRow(sql, 'qj_system_logs', {
    action,
    details,
    log_type: logType,
    source,
  }).catch(() => {});
}

async function ensureAppStateTable(sql) {
  await sql.query(`create table if not exists qj_app_state (key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now())`);
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.json();
}

async function fetchText(url, headers = {}) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.text();
}

function safeIso(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

// Imagem ilustrativa via Pexels (fotos livres). Opcional — só roda com
// PEXELS_API_KEY; sem ela, o artigo fica sem image_url e o front cai no
// gradiente de fallback que já existe.
//
// Em vez de uma única busca fixa por categoria, montamos uma lista ordenada de
// consultas do mais específico (empresa/ticker da matéria) ao mais genérico
// (palavra-chave do título → categoria), e tentamos uma a uma até achar foto.
// Assim a imagem tende a "bater" com o conteúdo (ex.: matéria da Petrobras puxa
// foto de plataforma de petróleo; matéria do dólar puxa foto de câmbio).

const PEXELS_QUERY_BY_CATEGORY = {
  bolsa: 'stock market trading floor',
  renda_fixa: 'bonds finance documents',
  juros: 'central bank interest rates',
  dolar: 'us dollar currency exchange',
  economia: 'economy finance city skyline',
  criptomoedas: 'cryptocurrency bitcoin',
  commodities: 'oil refinery commodities',
  empresas: 'corporate office business',
  internacional: 'global economy stock exchange',
};

// Ticker da B3 → busca em inglês que reflete o setor/negócio da empresa.
const PEXELS_QUERY_BY_TICKER = {
  PETR4: 'oil platform petroleum industry',
  PETR3: 'oil platform petroleum industry',
  VALE3: 'iron ore mining trucks',
  ITUB4: 'bank building finance',
  BBDC4: 'bank building finance',
  BBAS3: 'bank building finance',
  B3SA3: 'stock exchange trading',
  ABEV3: 'beer brewery production',
  WEGE3: 'electric motors industrial factory',
  MGLU3: 'retail store shopping',
  ITSA4: 'corporate finance investment',
  ELET3: 'power grid electricity transmission',
  ELET6: 'power grid electricity transmission',
  SUZB3: 'pulp paper factory forest',
  GGBR4: 'steel mill industry',
  RENT3: 'car rental fleet',
  PRIO3: 'offshore oil rig',
  RADL3: 'pharmacy drugstore',
  RAIL3: 'freight railway cargo train',
  EMBR3: 'commercial aircraft aviation',
};

// Palavra-chave (PT, no título) → busca em inglês. Ordem importa: a primeira
// que casar com o título é usada antes do fallback de categoria.
const PEXELS_TITLE_KEYWORDS = [
  [/\bbitcoin|cripto|ethereum|criptomoeda/i, 'cryptocurrency bitcoin trading'],
  [/\bd[óo]lar|c[âa]mbio|moeda/i, 'us dollar currency exchange'],
  [/\beuro\b/i, 'euro currency money'],
  [/\bselic|juros|copom/i, 'central bank interest rates'],
  [/\binfla[çc][ãa]o|ipca|pre[çc]os/i, 'rising prices inflation supermarket'],
  [/\bpetr[óo]leo|brent|barril/i, 'oil platform petroleum'],
  [/\bg[áa]s natural/i, 'natural gas pipeline'],
  [/\bouro\b/i, 'gold bars bullion'],
  [/\bmin[ée]rio|minera[çc][ãa]o/i, 'iron ore mining'],
  [/\bibovespa|bolsa|a[çc][õo]es|preg[ãa]o/i, 'stock market trading floor'],
  [/\bfed\b|federal reserve|eua|estados unidos/i, 'wall street new york finance'],
  [/\bchina|chin[êe]s/i, 'shanghai china economy'],
  [/\beuropa|europeu|bce/i, 'european central bank finance'],
  [/\bpib\b|recess[ãa]o|economia/i, 'economy city skyline business'],
  [/\bd[íi]vida|fiscal|governo|or[çc]amento/i, 'government finance documents'],
  [/\bsafra|agro|agroneg[óo]cio|soja|milho/i, 'agriculture farm harvest'],
  [/\bim[óo]vel|imobili[áa]rio|constru[çc][ãa]o/i, 'real estate construction buildings'],
  [/\btecnologia|intelig[êe]ncia artificial|\bia\b/i, 'technology artificial intelligence'],
  [/\bbanco|banc[áa]rio/i, 'bank building finance'],
];

async function fetchPexelsImage(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key || !query) return '';
  try {
    const data = await fetchJson(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      { Authorization: key },
    );
    const photos = data?.photos || [];
    if (photos.length === 0) return '';
    const pick = photos[Math.floor(Math.random() * Math.min(photos.length, 10))];
    return pick?.src?.landscape || pick?.src?.large || '';
  } catch {
    return '';
  }
}

// Extrai tickers de uma string "PETR4, VALE3" (campo tickers do articleRow).
function pickTickers(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;]/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
}

// Monta a lista ordenada de buscas (mais específica → mais genérica), sem
// duplicatas. A ordem define a prioridade da imagem escolhida.
function buildPexelsQueries(articleRow) {
  const queries = [];
  const push = (q) => { if (q && !queries.includes(q)) queries.push(q); };

  // 1) Ticker conhecido da matéria (setor da empresa).
  for (const ticker of pickTickers(articleRow.tickers)) {
    if (PEXELS_QUERY_BY_TICKER[ticker]) push(PEXELS_QUERY_BY_TICKER[ticker]);
  }

  // 2) Palavra-chave do título (tema central da notícia).
  const title = String(articleRow.title || '');
  for (const [regex, query] of PEXELS_TITLE_KEYWORDS) {
    if (regex.test(title)) { push(query); break; }
  }

  // 3) Fallback por categoria e, por fim, genérico.
  push(PEXELS_QUERY_BY_CATEGORY[articleRow.category]);
  push('finance stock market');

  return queries;
}

// Preenche image_url (se vazio) com a primeira foto encontrada entre as buscas
// candidatas. Mutações in-place no articleRow antes do insert. Limita a 3
// tentativas para respeitar o limite gratuito do Pexels (200 req/h) — na prática
// a primeira busca quase sempre retorna foto, então costuma ser 1 requisição.
async function resolveArticleImage(articleRow) {
  if (articleRow.image_url && String(articleRow.image_url).trim()) return articleRow;
  const queries = buildPexelsQueries(articleRow).slice(0, 3);
  for (const query of queries) {
    const url = await fetchPexelsImage(query);
    if (url) { articleRow.image_url = url; break; }
  }
  return articleRow;
}

// JSON market-news collectors. Each returns items already shaped like RSS items
// (title/link/description/pubDate/guid) plus source metadata, and yields [] when
// its API key is absent so the collector stays optional and never throws on setup.
async function fetchFinnhubNews() {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return [];
  const data = await fetchJson(`https://finnhub.io/api/v1/news?category=general&token=${token}`);
  return (Array.isArray(data) ? data : []).slice(0, 25).map((item) => ({
    title: item.headline,
    link: item.url,
    description: item.summary || '',
    pubDate: item.datetime ? new Date(item.datetime * 1000).toISOString() : '',
    guid: String(item.id || item.url),
    source_name: item.source ? `Finnhub · ${item.source}` : 'Finnhub',
    category: 'internacional',
    priority: 1,
    type: 'api',
  })).filter((item) => item.title && item.link);
}

// Busca por termos de mercado em vez de category=business: o "business" do
// GNews no Brasil traz muita loteria/notícia popular. A busca devolve só o que
// casa com a query financeira (o filtro isMarketRelevant ainda atua depois).
const GNEWS_FINANCE_QUERY = [
  'bolsa', 'ações', 'Ibovespa', '"mercado financeiro"', 'dólar', 'Selic', 'juros',
  'inflação', 'economia', 'investimento', 'Petrobras', 'Vale', 'dividendos',
  '"renda fixa"', 'câmbio', 'commodities', 'bitcoin', 'PIB', 'Copom', 'B3',
].join(' OR ');

async function fetchGNewsBrazil() {
  const token = process.env.GNEWS_API_KEY;
  if (!token) return [];
  const query = encodeURIComponent(GNEWS_FINANCE_QUERY);
  const data = await fetchJson(
    `https://gnews.io/api/v4/search?q=${query}&lang=pt&country=br&max=25&sortby=publishedAt&in=title,description&apikey=${token}`,
  );
  return (data?.articles || []).map((item) => ({
    title: item.title,
    link: item.url,
    description: item.description || '',
    pubDate: item.publishedAt || '',
    guid: item.url,
    source_name: item.source?.name ? `GNews · ${item.source.name}` : 'GNews Brasil',
    category: 'economia',
    priority: 1,
    type: 'api',
  })).filter((item) => item.title && item.link);
}

const API_COLLECTORS = [
  { name: 'Finnhub', fetch: fetchFinnhubNews },
  { name: 'GNews Brasil', fetch: fetchGNewsBrazil },
];

// Inserts a batch of normalized items into qj_raw_news_feed, skipping anything
// already seen via the shared dedupe sets. Used for both RSS and API sources.
async function ingestRawItems(sql, items, source, seen) {
  let collected = 0;
  let duplicates = 0;
  let irrelevant = 0;
  const newItems = [];

  for (const item of items) {
    // Descarta lixo fora do escopo (loteria etc.) antes de gastar IA com ele.
    if (!isMarketRelevant(item)) {
      irrelevant += 1;
      continue;
    }

    const contentHash = simpleHash(`${item.title}:${item.description}`);
    const externalId = item.guid || item.link;

    if (seen.urls.has(item.link) || seen.hashes.has(contentHash) || seen.externalIds.has(externalId)) {
      duplicates += 1;
      continue;
    }

    const priority = item.priority ?? source.priority ?? 2;
    const raw = await insertRow(sql, 'qj_raw_news_feed', {
      raw_title: item.title,
      raw_content: item.description,
      source_url: item.link,
      source_name: item.source_name || source.name,
      source_type: item.type || source.type || 'rss',
      category_hint: item.category || source.category,
      external_id: externalId,
      content_hash: contentHash,
      published_at: safeIso(item.pubDate),
      fetched_at: new Date().toISOString(),
      status: 'pending',
      relevance_score: priority <= 1 ? 8 : 6,
    }).catch((error) => {
      if (String(error.message).includes('duplicate')) return null;
      throw error;
    });

    if (raw) {
      seen.urls.add(item.link);
      seen.hashes.add(contentHash);
      seen.externalIds.add(externalId);
      collected += 1;
      newItems.push(raw);
    } else {
      duplicates += 1;
    }
  }

  return { collected, duplicates, irrelevant, newItems };
}

function isSaneQuote(symbol, price) {
  if (!Number.isFinite(price)) return false;
  const range = SANITY[symbol];
  return !range || (price >= range[0] && price <= range[1]);
}

async function invokeDeepSeek(prompt, schema = true, quality = false) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured.');

  const model = quality
    ? process.env.DEEPSEEK_QUALITY_MODEL || 'deepseek-reasoner'
    : process.env.DEEPSEEK_CHEAP_MODEL || 'deepseek-chat';

  const response = await fetch(`${process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: schema ? { type: 'json_object' } : undefined,
      temperature: 0.25,
      max_tokens: schema ? 8000 : 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  return schema ? JSON.parse(content) : content;
}

async function generateLongArticle(rawItem, forcedCategory) {
  let generated = await invokeDeepSeek(buildArticlePrompt(rawItem), true, false);
  if (forcedCategory) generated.category = forcedCategory;

  for (let attempt = 0; attempt < EXPANSION_ATTEMPTS; attempt += 1) {
    const normalized = normalizeGeneratedArticle(generated);
    if (articleWordCount(normalized) >= MIN_ARTICLE_WORDS) return normalized;

    generated = await invokeDeepSeek(buildArticleExpansionPrompt(normalized, rawItem), true, false);
    if (forcedCategory) generated.category = forcedCategory;
  }

  return normalizeGeneratedArticle(generated);
}

async function processRawNewsItem(sql, rawItem) {
  await updateRow(sql, 'qj_raw_news_feed', rawItem.id, { status: 'processing' });

  const titleKey = rawItem.raw_title?.toLowerCase().slice(0, 48);
  const existing = await sql.query(
    `select id from qj_articles where lower(left(title, 48)) = $1 limit 1`,
    [titleKey],
  );

  if (existing.length > 0) {
    await updateRow(sql, 'qj_raw_news_feed', rawItem.id, { status: 'duplicate', processed: false });
    return { processed: 0, duplicate: true };
  }

  const generated = await generateLongArticle(rawItem, rawItem.category_hint);
  const articleRow = toArticleRow(generated, rawItem);
  await resolveArticleImage(articleRow);
  const article = await insertArticle(sql, articleRow, rawItem.source_url || rawItem.id);

  await updateRow(sql, 'qj_raw_news_feed', rawItem.id, {
    status: 'processed',
    processed: true,
    article_id: article.id,
  });

  await logSystem(
    sql,
    `Processado: ${article.title}`,
    `IA: ${article.ai_confidence}% | Status: ${article.status} | Categoria: ${article.category}`,
    'success',
    'processRawNews',
  );

  return { processed: 1, article_id: article.id, title: article.title, status: article.status };
}

async function handleProcessRawNews(sql, body) {
  if (body.raw_id) {
    const rows = await sql.query(`select * from qj_raw_news_feed where id = $1 limit 1`, [body.raw_id]);
    if (rows.length === 0) return { success: true, message: 'Item não encontrado', processed: 0 };
    return { success: true, ...(await processRawNewsItem(sql, normalizeRow(rows[0]))) };
  }

  // Pega os pendentes mais recentes e processa o primeiro relevante, marcando
  // os irrelevantes (loteria etc.) como 'skipped' para não gastar IA com eles.
  const pending = await sql.query(
    `select * from qj_raw_news_feed where status = 'pending' order by created_date desc limit 25`,
  );

  if (pending.length === 0) {
    return { success: true, message: 'Nenhum item pendente', processed: 0 };
  }

  let skipped = 0;
  for (const row of pending) {
    const item = normalizeRow(row);
    if (!isMarketRelevant({ title: item.raw_title, description: item.raw_content })) {
      await updateRow(sql, 'qj_raw_news_feed', item.id, { status: 'skipped', processed: false }).catch(() => {});
      skipped += 1;
      continue;
    }
    return { success: true, skipped, ...(await processRawNewsItem(sql, item)) };
  }

  return { success: true, skipped, processed: 0, message: 'Somente itens irrelevantes na fila' };
}

async function handleCollectLatestNews(sql, body) {
  const autoProcess = body.auto_process !== false;
  const dbSources = await sql.query(
    `select * from qj_news_sources where is_active = true order by priority asc, created_date asc`,
  );
  const sources = dbSources.length > 0 ? dbSources : DEFAULT_RSS_SOURCES;
  const existingRows = await sql.query(
    `select source_url, content_hash, external_id from qj_raw_news_feed order by created_date desc limit 500`,
  );
  const seen = {
    urls: new Set(existingRows.map((row) => row.source_url).filter(Boolean)),
    hashes: new Set(existingRows.map((row) => row.content_hash).filter(Boolean)),
    externalIds: new Set(existingRows.map((row) => row.external_id).filter(Boolean)),
  };

  let collected = 0;
  let duplicates = 0;
  let irrelevant = 0;
  let errors = 0;
  const newItems = [];

  // 1. RSS feeds (DB-configured sources, or the curated defaults). Fetch in
  // parallel so a few slow feeds do not consume the whole 60s Vercel budget.
  const rssResults = await Promise.all(
    sources.map(async (source) => {
      try {
        return { source, xml: await fetchText(source.url, { 'User-Agent': 'QuantJournal/1.0' }) };
      } catch (error) {
        return { source, error };
      }
    }),
  );

  for (const feed of rssResults) {
    const { source } = feed;
    try {
      if (feed.error) throw feed.error;

      const result = await ingestRawItems(sql, parseRssItems(feed.xml), source, seen);
      collected += result.collected;
      duplicates += result.duplicates;
      irrelevant += result.irrelevant;
      newItems.push(...result.newItems);

      if (source.id) {
        await updateRow(sql, 'qj_news_sources', source.id, {
          last_checked_at: new Date().toISOString(),
          error_count: 0,
        });
      }
    } catch (error) {
      errors += 1;
      if (source.id) {
        await updateRow(sql, 'qj_news_sources', source.id, {
          error_count: Number(source.error_count || 0) + 1,
        }).catch(() => {});
      }
      await logSystem(sql, `Erro na fonte: ${source.name}`, error.message, 'error', 'collectLatestNews');
    }
  }

  // 2. JSON market-news APIs (each one is a no-op unless its API key is set).
  const apiResults = await Promise.all(
    API_COLLECTORS.map(async (collector) => {
      try {
        return { collector, items: await collector.fetch() };
      } catch (error) {
        return { collector, error };
      }
    }),
  );

  for (const resultItem of apiResults) {
    const { collector } = resultItem;
    try {
      if (resultItem.error) throw resultItem.error;

      const items = resultItem.items;
      if (items.length === 0) continue;
      const result = await ingestRawItems(sql, items, { name: collector.name, type: 'api', priority: 1 }, seen);
      collected += result.collected;
      duplicates += result.duplicates;
      irrelevant += result.irrelevant;
      newItems.push(...result.newItems);
    } catch (error) {
      errors += 1;
      await logSystem(sql, `Erro na fonte: ${collector.name}`, error.message, 'error', 'collectLatestNews');
    }
  }

  // Cap AI article generation per run to control DeepSeek cost as collection
  // frequency increases. Override with AUTO_PROCESS_LIMIT or the request body.
  const autoProcessLimit = Math.max(0, Number(body.auto_process_limit ?? process.env.AUTO_PROCESS_LIMIT ?? 3));

  let processed = 0;
  if (autoProcess && autoProcessLimit > 0 && newItems.length > 0 && process.env.DEEPSEEK_API_KEY) {
    for (const item of newItems.slice(0, autoProcessLimit)) {
      try {
        const result = await processRawNewsItem(sql, item);
        processed += result.processed || 0;
      } catch (error) {
        await updateRow(sql, 'qj_raw_news_feed', item.id, {
          status: 'failed',
          error_message: error.message,
        }).catch(() => {});
      }
    }
  }

  await logSystem(
    sql,
    'Coleta automática concluída',
    `Novas: ${collected} | Duplicadas: ${duplicates} | Irrelevantes: ${irrelevant} | Processadas: ${processed} | Erros: ${errors}`,
    collected > 0 ? 'success' : 'info',
    'collectLatestNews',
  );

  return { success: true, collected, duplicates, irrelevant, processed, errors };
}

async function handleBackfillNews(sql, body) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is required for backfillNews.');
  }

  const batchSize = Math.min(Number(body.batch_size || 5), 10);
  const offset = Number(body.offset || 0);
  const selectedTopics = BACKFILL_TOPICS.slice(offset, offset + batchSize);
  const created = [];

  for (const topic of selectedTopics) {
    const raw = {
      raw_title: topic.topic,
      raw_content: `Backfill editorial sobre ${topic.topic}`,
      source_name: 'Backfill IA',
      source_url: '',
      category_hint: topic.category,
    };
    const generated = await generateLongArticle(raw, topic.category);
    const articleRow = await resolveArticleImage(toArticleRow(generated, raw));
    const article = await insertArticle(sql, articleRow, topic.topic);
    created.push(article);
  }

  await logSystem(
    sql,
    'Backfill concluído',
    `Criados: ${created.length} | Offset: ${offset} | Próximo offset: ${offset + created.length}`,
    'success',
    'backfillNews',
  );

  return {
    success: true,
    created: created.length,
    next_offset: offset + created.length,
    done: offset + created.length >= BACKFILL_TOPICS.length,
  };
}

async function fetchFxQuotes() {
  const data = await fetchJson('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL');
  return [
    data?.USDBRL && { symbol: 'USD/BRL', name: 'Dólar', price: Number(data.USDBRL.bid), change_percent: Number(data.USDBRL.pctChange) || 0, market_type: 'fx' },
    data?.EURBRL && { symbol: 'EUR/BRL', name: 'Euro', price: Number(data.EURBRL.bid), change_percent: Number(data.EURBRL.pctChange) || 0, market_type: 'fx' },
  ].filter(Boolean);
}

async function fetchCryptoQuotes() {
  const data = await fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
  return [
    data?.bitcoin && { symbol: 'BTC', name: 'Bitcoin', price: data.bitcoin.usd, change_percent: +(data.bitcoin.usd_24h_change || 0).toFixed(2), market_type: 'crypto' },
    data?.ethereum && { symbol: 'ETH', name: 'Ethereum', price: data.ethereum.usd, change_percent: +(data.ethereum.usd_24h_change || 0).toFixed(2), market_type: 'crypto' },
  ].filter(Boolean);
}

async function fetchSelicQuote() {
  const data = await fetchJson('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
  const price = Number(data?.[0]?.valor);
  return Number.isFinite(price) ? [{ symbol: 'SELIC', name: 'SELIC a.a.', price, change_percent: 0, market_type: 'rate' }] : [];
}

async function fetchYahooQuotes() {
  const targets = [
    { symbol: 'IBOV', y: '^BVSP', name: 'Ibovespa', market_type: 'index' },
    { symbol: 'SPX', y: '^GSPC', name: 'S&P 500', market_type: 'index' },
    { symbol: 'GOLD', y: 'GC=F', name: 'Ouro', market_type: 'commodity' },
    { symbol: 'OIL', y: 'CL=F', name: 'Petróleo WTI', market_type: 'commodity' },
  ];
  const quotes = [];

  for (const target of targets) {
    try {
      const data = await fetchJson(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(target.y)}?range=5d&interval=1d`,
        { 'User-Agent': 'Mozilla/5.0' },
      );
      const meta = data?.chart?.result?.[0]?.meta;
      const price = Number(meta?.regularMarketPrice);
      const previous = Number(meta?.chartPreviousClose ?? meta?.previousClose);
      if (Number.isFinite(price)) {
        quotes.push({
          symbol: target.symbol,
          name: target.name,
          price,
          change_percent: Number.isFinite(previous) && previous ? +(((price - previous) / previous) * 100).toFixed(2) : 0,
          market_type: target.market_type,
        });
      }
    } catch {
      // Keep sources isolated so one failing quote does not break the radar.
    }
  }

  return quotes;
}

// Twelve Data: fonte única e estável para cotações globais (forex, cripto,
// índices, commodities). Opcional — só roda com TWELVEDATA_API_KEY. Símbolos
// que a TD não cobrir simplesmente não retornam, e as fontes legadas preenchem.
const TWELVEDATA_MAP = {
  'USD/BRL': { td: 'USD/BRL', name: 'Dólar', market_type: 'fx' },
  'EUR/BRL': { td: 'EUR/BRL', name: 'Euro', market_type: 'fx' },
  BTC: { td: 'BTC/USD', name: 'Bitcoin', market_type: 'crypto' },
  ETH: { td: 'ETH/USD', name: 'Ethereum', market_type: 'crypto' },
  SPX: { td: 'SPX', name: 'S&P 500', market_type: 'index' },
  GOLD: { td: 'XAU/USD', name: 'Ouro', market_type: 'commodity' },
  OIL: { td: 'WTI/USD', name: 'Petróleo WTI', market_type: 'commodity' },
};

async function fetchTwelveDataQuotes() {
  const token = process.env.TWELVEDATA_API_KEY;
  if (!token) return [];
  const entries = Object.entries(TWELVEDATA_MAP);
  const symbols = entries.map(([, meta]) => meta.td).join(',');
  const data = await fetchJson(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${token}`);

  const quotes = [];
  for (const [symbol, meta] of entries) {
    const quote = data?.[meta.td] ?? (data?.symbol === meta.td ? data : null);
    if (!quote || quote.status === 'error' || quote.code) continue;
    const price = Number(quote.close ?? quote.price);
    if (!Number.isFinite(price)) continue;
    quotes.push({
      symbol,
      name: meta.name,
      price,
      change_percent: +(Number(quote.percent_change) || 0).toFixed(2),
      market_type: meta.market_type,
    });
  }
  return quotes;
}

// Brapi: especialista em B3. Cobre o Ibovespa (e ações brasileiras) melhor que
// o Yahoo no caso nacional. Opcional — só roda com BRAPI_TOKEN.
const BRAPI_MAP = {
  IBOV: { brapi: '^BVSP', name: 'Ibovespa', market_type: 'index' },
};

// Ações da B3 acompanhadas (aparecem no ticker e dão preço às páginas de ativo).
const B3_STOCKS = [
  { ticker: 'PETR4', name: 'Petrobras' },
  { ticker: 'VALE3', name: 'Vale' },
  { ticker: 'ITUB4', name: 'Itaú Unibanco' },
  { ticker: 'BBDC4', name: 'Bradesco' },
  { ticker: 'B3SA3', name: 'B3' },
  { ticker: 'ABEV3', name: 'Ambev' },
  { ticker: 'WEGE3', name: 'WEG' },
  { ticker: 'BBAS3', name: 'Banco do Brasil' },
  { ticker: 'MGLU3', name: 'Magazine Luiza' },
  { ticker: 'ITSA4', name: 'Itaúsa' },
  { ticker: 'NUBR33', name: 'Nubank' },
  { ticker: 'INBR32', name: 'Banco Inter' },
];

async function fetchBrapiQuotes() {
  const token = process.env.BRAPI_TOKEN;
  if (!token) return [];
  const quotes = [];

  // Índice: requisição individual (multi-ticker não é suportado no plano free).
  for (const [symbol, meta] of Object.entries(BRAPI_MAP)) {
    try {
      const data = await fetchJson(`https://brapi.dev/api/quote/${encodeURIComponent(meta.brapi)}?token=${token}`);
      const result = data?.results?.[0];
      const price = Number(result?.regularMarketPrice);
      if (Number.isFinite(price)) {
        quotes.push({
          symbol,
          name: meta.name,
          price,
          change_percent: +(Number(result.regularMarketChangePercent) || 0).toFixed(2),
          market_type: meta.market_type,
        });
      }
    } catch { /* Yahoo cobre o Ibovespa no fallback */ }
  }

  // Ações: quote/list traz todas numa requisição só; filtramos a watchlist.
  try {
    const data = await fetchJson(`https://brapi.dev/api/quote/list?token=${token}`);
    const list = data?.stocks || [];
    const want = new Map(B3_STOCKS.map((s) => [s.ticker, s.name]));
    for (const item of list) {
      if (!want.has(item.stock)) continue;
      const price = Number(item.close);
      if (!Number.isFinite(price) || price <= 0) continue;
      quotes.push({
        symbol: item.stock,
        name: want.get(item.stock),
        price,
        change_percent: +(Number(item.change) || 0).toFixed(2),
        market_type: 'stock',
      });
    }
  } catch { /* sem ações se o list falhar */ }

  return quotes;
}

// Histórico de preços para o gráfico da página de ativo. B3/Ibovespa via Brapi,
// global (cripto/índices/commodities/câmbio) via Twelve Data.
const TD_HISTORY_SYMBOL = {
  BTC: 'BTC/USD', ETH: 'ETH/USD', SPX: 'SPX', GOLD: 'XAU/USD', OIL: 'WTI/USD',
  'USD/BRL': 'USD/BRL', 'EUR/BRL': 'EUR/BRL',
};
const RANGE_DAYS = { '1mo': 30, '3mo': 90, '1y': 365 };

async function fetchBrapiHistory(ticker, range) {
  const token = process.env.BRAPI_TOKEN;
  if (!token) return [];
  const data = await fetchJson(`https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?range=${range}&interval=1d&token=${token}`);
  const hist = data?.results?.[0]?.historicalDataPrice || [];
  return hist
    .filter((p) => p.date && Number.isFinite(Number(p.close)))
    .map((p) => ({ date: new Date(p.date * 1000).toISOString().slice(0, 10), close: +Number(p.close).toFixed(2) }));
}

async function fetchTwelveHistory(tdSymbol, days) {
  const token = process.env.TWELVEDATA_API_KEY;
  if (!token) return [];
  const data = await fetchJson(`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(tdSymbol)}&interval=1day&outputsize=${days}&apikey=${token}`);
  return (data?.values || [])
    .filter((v) => Number.isFinite(Number(v.close)))
    .map((v) => ({ date: v.datetime, close: +Number(v.close).toFixed(2) }))
    .reverse();
}

async function handleAssetHistory(sql, body) {
  const ticker = String(body.ticker || '').trim().toUpperCase();
  if (!ticker) throw new Error('ticker is required');
  const range = ['1mo', '3mo', '1y'].includes(body.range) ? body.range : '3mo';

  const isB3 = ticker === 'IBOV' || /^[A-Z]{4}\d{1,2}$/.test(ticker);
  const brapiTicker = ticker === 'IBOV' ? '^BVSP' : ticker;
  let series = [];
  let source = null;

  if (isB3) {
    try { series = await fetchBrapiHistory(brapiTicker, range); if (series.length) source = 'brapi'; } catch { /* segue */ }
  }
  if (!series.length && TD_HISTORY_SYMBOL[ticker]) {
    try { series = await fetchTwelveHistory(TD_HISTORY_SYMBOL[ticker], RANGE_DAYS[range]); if (series.length) source = 'twelvedata'; } catch { /* segue */ }
  }
  // Ações dos EUA / outros tickers alfabéticos -> Twelve Data com o próprio símbolo.
  if (!series.length && /^[A-Z]{1,5}$/.test(ticker)) {
    try { series = await fetchTwelveHistory(ticker, RANGE_DAYS[range]); if (series.length) source = 'twelvedata'; } catch { /* segue */ }
  }
  if (!series.length && !isB3) {
    try { series = await fetchBrapiHistory(brapiTicker, range); if (series.length) source = 'brapi'; } catch { /* segue */ }
  }

  return { success: true, ticker, range, source, series };
}

async function handleUpdateMarketSnapshots(sql) {
  const results = await Promise.allSettled([
    fetchFxQuotes(),
    fetchCryptoQuotes(),
    fetchSelicQuote(),
    fetchYahooQuotes(),
    fetchTwelveDataQuotes(),
    fetchBrapiQuotes(),
  ]);
  const legacy = results.slice(0, 4).flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  const twelve = results[4].status === 'fulfilled' ? results[4].value : [];
  const brapi = results[5].status === 'fulfilled' ? results[5].value : [];

  // Precedência por símbolo: legadas (Yahoo/AwesomeAPI/CoinGecko/BCB) < Twelve
  // Data (global) < Brapi (B3/Ibovespa). Cada camada sobrescreve a anterior só
  // nos símbolos que trouxe; o resto continua das fontes anteriores.
  const bySymbol = new Map();
  for (const quote of legacy) bySymbol.set(quote.symbol, quote);
  for (const quote of twelve) bySymbol.set(quote.symbol, quote);
  for (const quote of brapi) bySymbol.set(quote.symbol, quote);
  const quotes = [...bySymbol.values()];

  const saneQuotes = quotes.filter((quote) => isSaneQuote(quote.symbol, Number(quote.price)));

  let created = 0;
  let updated = 0;
  const now = new Date().toISOString();

  let failed = 0;
  for (const quote of saneQuotes) {
    try {
      const found = await sql.query(`select id from qj_market_snapshots where symbol = $1 limit 1`, [quote.symbol]);
      const payload = { ...quote, updated_at: now };
      if (found.length > 0) {
        await updateRow(sql, 'qj_market_snapshots', found[0].id, payload);
        updated += 1;
      } else {
        await insertRow(sql, 'qj_market_snapshots', payload);
        created += 1;
      }
    } catch {
      // Uma cotação problemática não deve derrubar todo o snapshot.
      failed += 1;
    }
  }

  await logSystem(
    sql,
    'Cotações atualizadas',
    `Atualizadas: ${updated} | Criadas: ${created} | Descartadas: ${quotes.length - saneQuotes.length}`,
    saneQuotes.length > 0 ? 'success' : 'error',
    'updateMarketSnapshots',
  );

  return { success: true, updated, created, failed, skipped: quotes.length - saneQuotes.length, symbols: saneQuotes.map((quote) => quote.symbol) };
}

// "Atualizar ao ler": função PÚBLICA que o front dispara enquanto há visitantes
// no site. Só busca cotações novas se as atuais estiverem velhas (> STALE), e um
// lock curto evita estouro de chamadas simultâneas (vários visitantes ao mesmo
// tempo). Como só lê cotações públicas e é auto-limitada, é segura sem token.
const QUOTES_STALE_MS = 5 * 60 * 1000; // considera velho após 5 min
const QUOTES_LOCK_MS = 60 * 1000;      // no máx. 1 atualização real por minuto

async function handleRefreshQuotesIfStale(sql) {
  await ensureAppStateTable(sql);

  // 1. Quão antiga é a cotação mais recente?
  const rows = await sql.query(`select max(updated_at) as last from qj_market_snapshots`);
  const last = rows[0]?.last ? new Date(rows[0].last).getTime() : 0;
  const ageMs = last ? Date.now() - last : Infinity;
  if (ageMs < QUOTES_STALE_MS) {
    return { success: true, refreshed: false, reason: 'fresh', age_seconds: Math.round(ageMs / 1000) };
  }

  // 2. Lock anti-estouro: se outra requisição já iniciou há < QUOTES_LOCK_MS, sai.
  const lockRows = await sql.query(`select value from qj_app_state where key = 'quotes_refresh_lock' limit 1`);
  let lockVal = lockRows[0]?.value;
  if (typeof lockVal === 'string') { try { lockVal = JSON.parse(lockVal); } catch { lockVal = null; } }
  const lockAt = lockVal?.at ? new Date(lockVal.at).getTime() : 0;
  if (lockAt && Date.now() - lockAt < QUOTES_LOCK_MS) {
    return { success: true, refreshed: false, reason: 'locked' };
  }

  // 3. Pega o lock e atualiza de fato.
  await sql.query(
    `insert into qj_app_state (key, value, updated_at) values ('quotes_refresh_lock', $1, now())
     on conflict (key) do update set value = $1, updated_at = now()`,
    [JSON.stringify({ at: new Date().toISOString() })],
  );

  const result = await handleUpdateMarketSnapshots(sql);
  return { success: true, refreshed: true, ...result };
}

// "Atualiza ao ser lido" para NOTÍCIAS — mesmo padrão das cotações. O cron do
// GitHub Actions é estrangulado no plano gratuito (buracos de horas), então
// dependemos dos visitantes para manter o jornal vivo: quando alguém abre o site
// e a matéria mais recente está há mais de NEWS_STALE_MS, o servidor coleta os
// feeds e gera UMA matéria, dentro do orçamento de 60s da Vercel. Como é pública
// e sem token, um lock curto evita estouro com vários visitantes simultâneos e o
// rate limit horário global continua valendo.
const NEWS_STALE_MS = 45 * 60 * 1000; // jornal considerado "parado" após 45 min
const NEWS_LOCK_MS = 3 * 60 * 1000;   // no máx. 1 disparo real a cada 3 min

async function handleRefreshNewsIfStale(sql) {
  await ensureAppStateTable(sql);

  // 1. Quão antiga é a matéria publicada mais recente?
  const rows = await sql.query(
    `select max(created_date) as last from qj_articles where status = 'publicado'`,
  );
  const last = rows[0]?.last ? new Date(rows[0].last).getTime() : 0;
  const ageMs = last ? Date.now() - last : Infinity;
  if (ageMs < NEWS_STALE_MS) {
    return { success: true, refreshed: false, reason: 'fresh', age_seconds: Math.round(ageMs / 1000) };
  }

  // 2. Lock anti-estouro: se outra requisição já iniciou há < NEWS_LOCK_MS, sai.
  const lockRows = await sql.query(`select value from qj_app_state where key = 'news_refresh_lock' limit 1`);
  let lockVal = lockRows[0]?.value;
  if (typeof lockVal === 'string') { try { lockVal = JSON.parse(lockVal); } catch { lockVal = null; } }
  const lockAt = lockVal?.at ? new Date(lockVal.at).getTime() : 0;
  if (lockAt && Date.now() - lockAt < NEWS_LOCK_MS) {
    return { success: true, refreshed: false, reason: 'locked' };
  }

  // 3. Pega o lock e dispara coleta + geração de 1 matéria.
  await sql.query(
    `insert into qj_app_state (key, value, updated_at) values ('news_refresh_lock', $1, now())
     on conflict (key) do update set value = $1, updated_at = now()`,
    [JSON.stringify({ at: new Date().toISOString() })],
  );

  // Coleta os feeds (rápido, sem IA) e gera UMA matéria da fila. Se o DeepSeek
  // não estiver configurado, a coleta ainda enche a fila para o cron processar.
  await handleCollectLatestNews(sql, { auto_process: false }).catch(() => {});
  let processed = null;
  if (process.env.DEEPSEEK_API_KEY) {
    processed = await handleProcessRawNews(sql, {}).catch(() => null);
  }
  return { success: true, refreshed: true, processed };
}

// Ajuste de schema idempotente: garante que market_type aceite 'stock' (a
// constraint original não previa ações da B3). Admin-only, rodar uma vez.
async function handleEnsureSchema(sql) {
  await sql.query(`alter table qj_market_snapshots drop constraint if exists qj_market_snapshots_market_type_check`);
  await sql.query(`alter table qj_market_snapshots add constraint qj_market_snapshots_market_type_check check (market_type in ('index', 'fx', 'crypto', 'commodity', 'rate', 'stock'))`);
  // Manchete fixada pelo editor.
  await sql.query(`alter table qj_articles add column if not exists is_headline boolean not null default false`);
  // Estado do site (ex.: resumo do dia gerado pelo cron).
  await sql.query(`create table if not exists qj_app_state (key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now())`);
  // Contas de usuário (auth real — ver api/auth/[action].js).
  await sql.query(`create table if not exists qj_users (
    id text primary key,
    email text unique not null,
    password_hash text not null,
    full_name text,
    role text not null default 'user',
    reset_token_hash text,
    reset_expires timestamptz,
    created_date timestamptz not null default now(),
    updated_date timestamptz not null default now()
  )`);
  // Marca quando o artigo foi postado no X (Twitter) — evita repostar.
  await sql.query(`alter table qj_articles add column if not exists tweeted_at timestamptz`);
  return { success: true, message: "Schema OK: market_type 'stock', is_headline, qj_app_state, qj_users e tweeted_at." };
}

// Gera o "Resumo IA do dia" no servidor (cron) e guarda em qj_app_state — assim
// não roda no navegador de cada visitante (caro/lento).
async function handleGenerateDailySummary(sql) {
  await ensureAppStateTable(sql);
  if (!process.env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY é necessária.');
  const arts = await sql.query(`select title, tickers from qj_articles where status = 'publicado' order by created_date desc limit 10`);
  if (arts.length < 3) return { success: true, skipped: true, message: 'Poucas matérias para resumir.' };

  const context = arts.map((a) => `- ${a.title}${a.tickers ? ` [${a.tickers}]` : ''}`).join('\n');
  const prompt = `Você é analista financeiro sênior. Analise as notícias e escreva exatamente 3 bullets executivos para investidores brasileiros.

Bullet 1 — Principal movimento do mercado hoje (max 20 palavras)
Bullet 2 — Ativos que merecem atenção e por quê (max 20 palavras, mencione tickers)
Bullet 3 — Evento mais importante para monitorar nos próximos dias (max 20 palavras)

Notícias:
${context}

Seja assertivo e concreto. Sem URLs. Retorne JSON com: bullets (array de 3 strings) e mood ("otimista", "cauteloso" ou "pessimista").`;

  const result = await invokeDeepSeek(prompt, true, false);
  const value = {
    bullets: Array.isArray(result.bullets) ? result.bullets.slice(0, 3) : [],
    mood: ['otimista', 'cauteloso', 'pessimista'].includes(result.mood) ? result.mood : 'cauteloso',
    day: new Date().toISOString().slice(0, 10),
  };
  await sql.query(
    `insert into qj_app_state (key, value, updated_at) values ('daily_summary', $1, now())
     on conflict (key) do update set value = $1, updated_at = now()`,
    [JSON.stringify(value)],
  );
  return { success: true, ...value };
}

// Leitura pública (sem IA): o front lê o resumo já gerado.
async function handleGetDailySummary(sql) {
  await ensureAppStateTable(sql);
  const rows = await sql.query(`select value from qj_app_state where key = 'daily_summary' limit 1`);
  let value = rows[0]?.value || null;
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { value = null; } }
  return { success: true, summary: value };
}

// Fixa uma matéria como manchete (e desmarca as demais). Sem id, limpa a manchete.
async function handleSetHeadline(sql, body) {
  const id = body.id ? String(body.id) : null;
  if (id) {
    await sql.query(`update qj_articles set is_headline = (id = $1)`, [id]);
    return { success: true, headline_id: id };
  }
  await sql.query(`update qj_articles set is_headline = false where is_headline = true`);
  return { success: true, headline_id: null };
}

// IA escolhe a manchete por relevância + impacto (confiança e recência desempatam).
// Roda no ciclo de coleta (a cada 30min), então é estável entre execuções.
const HEADLINE_RELEVANCE = { urgente: 4, alta: 3, media: 2, baixa: 1 };
const HEADLINE_IMPACT = { critico: 4, alto: 3, medio: 2, baixo: 1 };

async function handlePickHeadline(sql) {
  const rows = await sql.query(
    `select id, relevance, impact_level, ai_confidence, created_date from qj_articles where status = 'publicado' and created_date > now() - interval '48 hours'`,
  );
  if (rows.length === 0) return { success: true, headline_id: null, message: 'Sem artigos recentes.' };

  let bestId = null;
  let bestScore = -1;
  for (const r of rows) {
    const rel = HEADLINE_RELEVANCE[r.relevance] || 1;
    const imp = HEADLINE_IMPACT[r.impact_level] || 1;
    const conf = Number(r.ai_confidence) || 0;
    const ageHours = (Date.now() - new Date(r.created_date).getTime()) / 3_600_000;
    const recency = Math.max(0, 48 - ageHours) / 48; // 0..1
    const score = rel * 10 + imp * 10 + conf * 0.05 + recency * 3;
    if (score > bestScore) { bestScore = score; bestId = r.id; }
  }

  await sql.query(`update qj_articles set is_headline = (id = $1)`, [bestId]);
  await logSystem(sql, 'Manchete escolhida (IA)', `id: ${bestId} | score: ${bestScore.toFixed(1)}`, 'success', 'pickHeadline');
  return { success: true, headline_id: bestId, score: bestScore };
}

async function handleSendDailyNewsletter(sql, body) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');

  const articles = await sql.query(`select * from qj_articles where status = 'publicado' order by created_date desc limit 12`);
  const subscribers = await sql.query(`select * from qj_newsletter_subscribers where is_active = true limit 250`);
  const html = await invokeDeepSeek(buildNewsletterPrompt(articles), false, false);
  const type = body.type || 'daily';
  let sent = 0;

  for (const subscriber of subscribers) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.NEWSLETTER_FROM || 'Capital Times <news@example.com>',
        to: subscriber.email,
        subject: `Capital Times: resumo ${type}`,
        html,
      }),
    });
    if (response.ok) sent += 1;
  }

  await logSystem(sql, `Newsletter enviada`, `Tipo: ${type} | Enviados: ${sent}`, 'success', 'sendDailyNewsletter');
  return { success: true, sent };
}

async function handleIngestNews(sql, body) {
  if (!body.title) throw new Error('title is required');
  const record = await insertRow(sql, 'qj_raw_news_feed', {
    source_name: body.source || 'Externo',
    source_url: body.url || '',
    raw_title: body.title,
    raw_content: body.content || '',
    fetched_at: new Date().toISOString(),
    processed: false,
    status: 'pending',
    content_hash: simpleHash(`${body.title}:${body.content || ''}`),
  });
  return { success: true, id: record.id };
}

async function handleAutoPublishNews(sql) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is required for autoPublishNews.');
  }
  const topic = BACKFILL_TOPICS[Math.floor(Math.random() * BACKFILL_TOPICS.length)];
  const raw = {
    raw_title: topic.topic,
    raw_content: `Gere análise atual sobre ${topic.topic}`,
    source_name: 'Auto publicação IA',
    source_url: '',
    category_hint: topic.category,
  };
  const generated = await generateLongArticle(raw, topic.category);
  const articleRow = await resolveArticleImage(toArticleRow(generated, raw));
  const article = await insertArticle(sql, articleRow, topic.topic);
  await logSystem(sql, `Auto-publicado: ${article.title}`, `Categoria: ${article.category}`, 'success', 'autoPublishNews');
  return { success: true, article_id: article.id, title: article.title, category: article.category };
}

// Preenche imagens dos artigos já publicados que estão sem image_url.
async function handleBackfillImages(sql, body) {
  if (!process.env.PEXELS_API_KEY) throw new Error('PEXELS_API_KEY is required for backfillImages.');
  const limit = Math.min(Number(body.limit || 20), 50);
  const rows = await sql.query(
    `select id, category from qj_articles where image_url is null or image_url = '' order by created_date desc limit $1`,
    [limit],
  );

  let updated = 0;
  for (const row of rows) {
    const query = PEXELS_QUERY_BY_CATEGORY[row.category] || 'finance stock market';
    const url = await fetchPexelsImage(query);
    if (url) {
      await updateRow(sql, 'qj_articles', row.id, { image_url: url });
      updated += 1;
    }
  }

  await logSystem(sql, 'Backfill de imagens', `Escaneados: ${rows.length} | Atualizados: ${updated}`, 'success', 'backfillImages');
  return { success: true, scanned: rows.length, updated };
}

// Contas de admin: ADMIN_USERS = "email1:senha1,email2:senha2" (preferido) com
// fallback para ADMIN_EMAIL/ADMIN_PASSWORD (conta única).
function adminAccounts() {
  const map = new Map();
  for (const pair of String(process.env.ADMIN_USERS || '').split(',')) {
    const i = pair.indexOf(':');
    if (i > 0) map.set(pair.slice(0, i).trim().toLowerCase(), pair.slice(i + 1));
  }
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    map.set(String(process.env.ADMIN_EMAIL).trim().toLowerCase(), process.env.ADMIN_PASSWORD);
  }
  return map;
}

// Login do admin: valida e-mail/senha contra as envs do servidor (não ficam no
// bundle do front) e devolve o token de sessão.
async function handleAdminLogin(sql, body) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const token = process.env.ADMIN_TOKEN || '';
  if (!token) throw new Error('Autenticação de admin não configurada no servidor.');

  const accounts = adminAccounts();
  if (password && accounts.get(email) === password) {
    return { success: true, token };
  }
  return { success: false, error: 'E-mail ou senha inválidos.' };
}

// ---- Postagem automática no X (Twitter) ----

// Emoji + rótulo por categoria, no estilo dos portais de notícia.
const X_CATEGORY = {
  bolsa: { emoji: '📈', label: 'Bolsa' },
  dolar: { emoji: '💵', label: 'Câmbio' },
  juros: { emoji: '🏦', label: 'Juros' },
  criptomoedas: { emoji: '🪙', label: 'Cripto' },
  commodities: { emoji: '🛢️', label: 'Commodities' },
  empresas: { emoji: '🏢', label: 'Empresas' },
  internacional: { emoji: '🌎', label: 'Internacional' },
  economia: { emoji: '📊', label: 'Economia' },
  renda_fixa: { emoji: '💰', label: 'Renda Fixa' },
};

const URL_WEIGHT = 23; // o X conta qualquer link como 23 chars (t.co)
// Conta com X Premium permite posts longos (até 25k chars). Damos espaço
// suficiente para o resumo da matéria caber INTEIRO na maioria dos casos.
// Ajustável via env X_MAX_CHARS.
const TWEET_BUDGET_DEFAULT = 1000;

function codepointLen(str) {
  return [...String(str)].length;
}

// Corta o texto sem deixar palavra picada. Preferência: terminar no fim de uma
// frase (. ! ?) — aí nem precisa de reticências, fica natural. Se não der, corta
// na última palavra inteira e adiciona "…".
function smartTruncate(text, max) {
  const chars = [...String(text)];
  if (chars.length <= max) return text;
  const slice = chars.slice(0, max).join('');
  // Fim de frase mais distante dentro do limite (exige ter passado da metade
  // para não cortar curto demais).
  const sentenceEnd = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('.\n'),
  );
  if (sentenceEnd >= max * 0.5) {
    return slice.slice(0, sentenceEnd + 1).trim();
  }
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.4 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

// Cashtags a partir do campo tickers ("PETR4, VALE3" → ["$PETR4","$VALE3"]).
export function cashtagsFromTickers(tickers) {
  return String(tickers || '')
    .split(/[,;]/)
    .map((t) => t.trim().toUpperCase())
    .filter((t) => /^[A-Z][A-Z0-9]{1,9}$/.test(t))
    .slice(0, 3)
    .map((t) => `$${t}`);
}

// Monta o texto do tweet respeitando o limite de caracteres. Estilo portal:
// cabeçalho (emoji+categoria) + título + resumo + cashtags.
//
// Por padrão NÃO inclui o link da matéria: no pay-per-use do X, um post COM URL
// custa US$ 0,20, enquanto texto puro custa ~US$ 0,015 (13× mais barato). O link
// fica fixado na bio do perfil. Passe { includeLink: true } (env X_INCLUDE_LINK)
// para voltar a embutir o link, ciente do custo maior.
// Exportado p/ teste unitário.
export function buildTweet(article, siteUrl, opts = {}) {
  const includeLink = opts.includeLink === true;
  const budget = Math.max(120, Number(opts.maxChars) || TWEET_BUDGET_DEFAULT);
  const cat = X_CATEGORY[article.category] || { emoji: '📰', label: 'Mercado' };
  const breaking = article.is_breaking || article.relevance === 'urgente';
  const prefix = `${breaking ? '🚨 ' : ''}${cat.emoji} ${cat.label} · `;
  const url = includeLink ? `${String(siteUrl).replace(/\/$/, '')}/artigo/${article.id}` : '';
  const cashtags = cashtagsFromTickers(article.tickers);
  const tagsLine = cashtags.length ? cashtags.join(' ') : '';

  const title = String(article.title || 'Análise de mercado').trim();
  const summary = String(article.summary || '').replace(/\s+/g, ' ').trim();

  // Custo fixo: prefixo + título + (cashtags) + (link, se houver).
  const fixed =
    codepointLen(prefix) +
    codepointLen(title) +
    (tagsLine ? codepointLen(tagsLine) + 2 : 0) + // "\n\n" + cashtags
    (includeLink ? URL_WEIGHT + 2 : 0); // "\n\n" + url

  let summaryOut = '';
  const room = budget - fixed - 2; // -2 p/ "\n\n" antes do resumo
  if (summary && room > 20) {
    summaryOut = codepointLen(summary) <= room ? summary : smartTruncate(summary, room);
  }

  let text = `${prefix}${title}`;
  if (summaryOut) text += `\n\n${summaryOut}`;
  if (tagsLine) text += `\n\n${tagsLine}`;
  if (includeLink) text += `\n\n${url}`;
  return text;
}

// Posta no X os artigos publicados ainda não tuitados (janela recente, para não
// despejar o backlog no primeiro deploy). Limite por execução via X_MAX_PER_RUN.
async function handlePostArticlesToX(sql) {
  if (!hasXCredentials()) {
    return { success: true, skipped: true, reason: 'Credenciais do X não configuradas.' };
  }
  // Janela de horário (BRT, UTC-3): só posta nas horas de pico/acordado para
  // maximizar engajamento e não desperdiçar matérias na madrugada. Padrão 8h–23h.
  // Ajustável via X_ACTIVE_START / X_ACTIVE_END (hora cheia, 0–24). Para postar
  // 24h, use X_ACTIVE_START=0 e X_ACTIVE_END=24.
  const startH = Math.max(0, Math.min(24, Number(process.env.X_ACTIVE_START ?? 8)));
  const endH = Math.max(0, Math.min(24, Number(process.env.X_ACTIVE_END ?? 23)));
  const hourBRT = (new Date().getUTCHours() - 3 + 24) % 24;
  if (hourBRT < startH || hourBRT >= endH) {
    return { success: true, skipped: true, reason: `Fora da janela de postagem (${startH}h–${endH}h BRT). Agora: ${hourBRT}h BRT.` };
  }

  // Garante a coluna (idempotente) — funciona mesmo sem rodar ensureSchema antes.
  await sql.query(`alter table qj_articles add column if not exists tweeted_at timestamptz`);
  const siteUrl = process.env.SITE_URL || 'https://www.capitaltimes.com.br';
  const maxPerRun = Math.max(1, Math.min(5, Number(process.env.X_MAX_PER_RUN) || 2));
  // Janela maior (padrão 16h) para que matérias da madrugada ainda sejam postadas
  // de manhã, quando a janela de horário reabre.
  const windowHours = Math.max(1, Number(process.env.X_WINDOW_HOURS) || 16);
  // Padrão: SEM link (texto puro ~US$ 0,015/post). X_INCLUDE_LINK=true volta a
  // embutir o link da matéria (US$ 0,20/post no pay-per-use do X).
  const includeLink = process.env.X_INCLUDE_LINK === 'true';
  const maxChars = Number(process.env.X_MAX_CHARS) || undefined;

  // Prioriza o que tende a engajar mais: maior relevância e maior impacto
  // primeiro (urgente/alta + crítico/alto), e em empate o mais recente. Assim,
  // dentro do teto por execução, postamos as matérias mais fortes — não só as
  // mais antigas da fila.
  const rows = await sql.query(
    `select id, title, summary, category, tickers, is_breaking, relevance
       from qj_articles
      where status = 'publicado'
        and tweeted_at is null
        and created_date > now() - ($1 || ' hours')::interval
      order by
        (case relevance when 'urgente' then 3 when 'alta' then 2 when 'media' then 1 else 0 end) desc,
        (case impact_level when 'critico' then 3 when 'alto' then 2 when 'medio' then 1 else 0 end) desc,
        created_date desc
      limit $2`,
    [String(windowHours), maxPerRun],
  );

  const results = [];
  for (const article of rows) {
    const text = buildTweet(article, siteUrl, { includeLink, maxChars });
    const res = await postTweet(text);
    if (res.ok) {
      await updateRow(sql, 'qj_articles', article.id, { tweeted_at: new Date().toISOString() });
      results.push({ id: article.id, tweet_id: res.id, ok: true });
      await logSystem(sql, `Postado no X: ${article.title}`, `tweet ${res.id}`, 'success', 'postArticlesToX');
    } else if (/duplicate/i.test(String(res.error))) {
      // Só conteúdo DUPLICADO é marcado como tuitado p/ não travar a fila.
      await updateRow(sql, 'qj_articles', article.id, { tweeted_at: new Date().toISOString() });
      results.push({ id: article.id, ok: false, skipped: true, error: res.error });
      await logSystem(sql, `X: duplicado (marcado): ${article.title}`, String(res.error), 'warning', 'postArticlesToX');
    } else {
      // Qualquer outro erro (permissão do app, pagamento/crédito, rate limit,
      // rede): NÃO marca — para e tenta no próximo ciclo, sem queimar a fila.
      results.push({ id: article.id, ok: false, error: res.error, status: res.status });
      await logSystem(sql, `Falha ao postar no X: ${article.title}`, `${res.status}: ${res.error}`, 'error', 'postArticlesToX');
      break;
    }
  }

  return { success: true, posted: results.filter((r) => r.ok).length, results };
}

const handlers = {
  processRawNews: handleProcessRawNews,
  collectLatestNews: handleCollectLatestNews,
  collectNewsSources: handleCollectLatestNews,
  backfillNews: handleBackfillNews,
  backfillImages: handleBackfillImages,
  updateMarketSnapshots: handleUpdateMarketSnapshots,
  refreshQuotesIfStale: handleRefreshQuotesIfStale,
  refreshNewsIfStale: handleRefreshNewsIfStale,
  assetHistory: handleAssetHistory,
  sendDailyNewsletter: handleSendDailyNewsletter,
  ingestNews: handleIngestNews,
  autoPublishNews: handleAutoPublishNews,
  adminLogin: handleAdminLogin,
  ensureSchema: handleEnsureSchema,
  setHeadline: handleSetHeadline,
  pickHeadline: handlePickHeadline,
  generateDailySummary: handleGenerateDailySummary,
  getDailySummary: handleGetDailySummary,
  postArticlesToX: handlePostArticlesToX,
};

// Limite de chamadas por hora (anti-abuso/custo) para as funções do cron, que
// rodam sem token. Usa qj_app_state como contador. Fail-open: se falhar, libera.
async function withinRateLimit(sql, name, maxPerHour) {
  try {
    const key = `rl:${name}`;
    const rows = await sql.query(`select value from qj_app_state where key = $1 limit 1`, [key]);
    let v = rows[0]?.value;
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch { v = null; } }
    const now = Date.now();
    let count = Number(v?.count) || 0;
    let windowStart = Number(v?.windowStart) || now;
    if (now - windowStart > 3_600_000) { count = 0; windowStart = now; }
    count += 1;
    await sql.query(
      `insert into qj_app_state (key, value, updated_at) values ($1, $2, now())
       on conflict (key) do update set value = $2, updated_at = now()`,
      [key, JSON.stringify({ count, windowStart })],
    );
    return count <= maxPerHour;
  } catch {
    return true;
  }
}

// Funções acionadas pelo cron/GitHub Actions: rodam SEM token (sem precisar de
// secret no GitHub), mas limitadas por hora. Escrita de dados, login e funções
// manuais do admin continuam exigindo token.
const CRON_FUNCTIONS = {
  collectLatestNews: 8,
  collectNewsSources: 8,
  processRawNews: 30,
  updateMarketSnapshots: 20,
  pickHeadline: 10,
  generateDailySummary: 6,
  postArticlesToX: 10,
};

export default async function handler(req, res) {
  const name = req.query.name;
  // Support CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.statusCode = 204;
    res.end();
    return;
  }

  // Vercel Cron triggers functions with a GET (no body), so accept both verbs.
  if (req.method !== 'POST' && req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  // Funções públicas (chamadas pelo front sem login).
  const PUBLIC_FUNCTIONS = new Set(['assetHistory', 'adminLogin', 'getDailySummary', 'refreshQuotesIfStale', 'refreshNewsIfStale']);

  try {
    const fn = handlers[name];
    if (!fn) {
      return sendJson(res, 404, { error: `Unknown function: ${name}` });
    }

    const sql = getSql();
    const admin = isAdminRequest(req);

    if (!admin && !PUBLIC_FUNCTIONS.has(name)) {
      const cronLimit = CRON_FUNCTIONS[name];
      if (cronLimit === undefined) {
        // Funções administrativas (escrita/manuais) exigem token.
        return sendJson(res, 401, { error: 'Não autorizado' });
      }
      if (!(await withinRateLimit(sql, name, cronLimit))) {
        return sendJson(res, 429, { error: 'Limite de uso por hora atingido.' });
      }
    }

    const body = req.method === 'POST' ? (req.body || {}) : {};
    const result = await fn(sql, body);
    return sendJson(res, 200, result);
  } catch (error) {
    const sql = process.env.DATABASE_URL ? getSql() : null;
    if (sql) {
      await logSystem(sql, `Erro em função: ${name}`, error.message, 'error', name).catch(() => {});
    }
    return sendJson(res, 500, { error: error.message });
  }
}
