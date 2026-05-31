import { getSql, normalizeRow, sendJson, toDatabasePayload } from '../_db.js';
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

async function insertArticle(sql, payload, seed = '') {
  const row = { ...payload };
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

  // 1. RSS feeds (DB-configured sources, or the curated defaults).
  for (const source of sources) {
    try {
      const xml = await fetchText(source.url, { 'User-Agent': 'QuantJournal/1.0' });
      const result = await ingestRawItems(sql, parseRssItems(xml), source, seen);
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
  for (const collector of API_COLLECTORS) {
    try {
      const items = await collector.fetch();
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
    const article = await insertArticle(sql, toArticleRow(generated, raw), topic.topic);
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

async function fetchBrapiQuotes() {
  const token = process.env.BRAPI_TOKEN;
  if (!token) return [];
  const entries = Object.entries(BRAPI_MAP);
  const tickers = entries.map(([, meta]) => meta.brapi).join(',');
  const data = await fetchJson(`https://brapi.dev/api/quote/${encodeURIComponent(tickers)}?token=${token}`);
  const results = data?.results || [];

  const quotes = [];
  for (const [symbol, meta] of entries) {
    const result = results.find((r) => r.symbol === meta.brapi);
    const price = Number(result?.regularMarketPrice);
    if (!Number.isFinite(price)) continue;
    quotes.push({
      symbol,
      name: meta.name,
      price,
      change_percent: +(Number(result.regularMarketChangePercent) || 0).toFixed(2),
      market_type: meta.market_type,
    });
  }
  return quotes;
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

  for (const quote of saneQuotes) {
    const found = await sql.query(`select id from qj_market_snapshots where symbol = $1 limit 1`, [quote.symbol]);
    const payload = { ...quote, updated_at: now };
    if (found.length > 0) {
      await updateRow(sql, 'qj_market_snapshots', found[0].id, payload);
      updated += 1;
    } else {
      await insertRow(sql, 'qj_market_snapshots', payload);
      created += 1;
    }
  }

  await logSystem(
    sql,
    'Cotações atualizadas',
    `Atualizadas: ${updated} | Criadas: ${created} | Descartadas: ${quotes.length - saneQuotes.length}`,
    saneQuotes.length > 0 ? 'success' : 'error',
    'updateMarketSnapshots',
  );

  return { success: true, updated, created, skipped: quotes.length - saneQuotes.length, symbols: saneQuotes.map((quote) => quote.symbol) };
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
        from: process.env.NEWSLETTER_FROM || 'FinAI Pulse <news@example.com>',
        to: subscriber.email,
        subject: `FinAI Pulse: resumo ${type}`,
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
  const article = await insertArticle(sql, toArticleRow(generated, raw), topic.topic);
  await logSystem(sql, `Auto-publicado: ${article.title}`, `Categoria: ${article.category}`, 'success', 'autoPublishNews');
  return { success: true, article_id: article.id, title: article.title, category: article.category };
}

const handlers = {
  processRawNews: handleProcessRawNews,
  collectLatestNews: handleCollectLatestNews,
  collectNewsSources: handleCollectLatestNews,
  backfillNews: handleBackfillNews,
  updateMarketSnapshots: handleUpdateMarketSnapshots,
  sendDailyNewsletter: handleSendDailyNewsletter,
  ingestNews: handleIngestNews,
  autoPublishNews: handleAutoPublishNews,
};

export default async function handler(req, res) {
  const name = req.query.name;

  // Vercel Cron triggers functions with a GET (no body), so accept both verbs.
  if (req.method !== 'POST' && req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const fn = handlers[name];
    if (!fn) {
      return sendJson(res, 404, { error: `Unknown function: ${name}` });
    }

    const sql = getSql();
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
