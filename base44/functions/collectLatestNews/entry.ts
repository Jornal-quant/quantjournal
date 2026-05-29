import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Curated public RSS feeds for financial news
const RSS_SOURCES = [
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', category: 'internacional', priority: 1 },
  { name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories/', category: 'internacional', priority: 1 },
  { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', category: 'internacional', priority: 1 },
  { name: 'CNBC Finance', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', category: 'internacional', priority: 1 },
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'criptomoedas', priority: 2 },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss', category: 'criptomoedas', priority: 2 },
  { name: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/', category: 'economia', priority: 1 },
  { name: 'Infomoney', url: 'https://www.infomoney.com.br/feed/', category: 'economia', priority: 1 },
  { name: 'Oil Price', url: 'https://oilprice.com/rss/main', category: 'commodities', priority: 2 },
  { name: 'Kitco Gold', url: 'https://www.kitco.com/rss/kitco-news.rss', category: 'commodities', priority: 2 },
];

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

async function fetchRSS(url) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const xml = data.contents || '';

  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const getField = (tag) => {
      const cdataMatch = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i').exec(block);
      const plainMatch = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i').exec(block);
      return (cdataMatch || plainMatch || [])[1]?.trim() || '';
    };
    const title = getField('title');
    const link = getField('link') || (/<link[^>]*\/>/i.exec(block) || [])[0] || '';
    const description = getField('description').replace(/<[^>]+>/g, '').slice(0, 600);
    const pubDate = getField('pubDate');
    const guid = getField('guid') || link;

    if (title && title.length > 10) {
      items.push({
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'),
        link: link.trim(),
        description,
        pubDate,
        guid: guid.trim(),
      });
    }
  }
  return items.slice(0, 15);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const autoProcess = body.auto_process !== false; // default true

    // Load existing to deduplicate
    const existingRaw = await base44.asServiceRole.entities.RawNewsFeed.list('-created_date', 300);
    const existingUrls = new Set(existingRaw.map((r) => r.source_url).filter(Boolean));
    const existingHashes = new Set(existingRaw.map((r) => r.content_hash).filter(Boolean));
    const existingExtIds = new Set(existingRaw.map((r) => r.external_id).filter(Boolean));

    let collected = 0;
    let duplicates = 0;
    let errors = 0;
    const newItems = [];

    for (const source of RSS_SOURCES) {
      try {
        const items = await fetchRSS(source.url);

        for (const item of items) {
          const hash = simpleHash(item.title + item.description);
          const extId = item.guid || item.link;

          if (existingUrls.has(item.link) || existingHashes.has(hash) || existingExtIds.has(extId)) {
            duplicates++;
            continue;
          }

          const raw = await base44.asServiceRole.entities.RawNewsFeed.create({
            raw_title: item.title,
            raw_content: item.description,
            source_url: item.link,
            source_name: source.name,
            source_type: 'rss',
            category_hint: source.category,
            external_id: extId,
            content_hash: hash,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            fetched_at: new Date().toISOString(),
            status: 'pending',
            relevance_score: source.priority <= 1 ? 8 : 6,
          });

          existingUrls.add(item.link);
          existingHashes.add(hash);
          existingExtIds.add(extId);
          collected++;
          newItems.push(raw);
        }

        // Update source last checked
        const sources = await base44.asServiceRole.entities.NewsSource.filter({ url: source.url });
        if (sources.length > 0) {
          await base44.asServiceRole.entities.NewsSource.update(sources[0].id, {
            last_checked_at: new Date().toISOString(),
            error_count: 0,
          });
        }
      } catch (err) {
        errors++;
        await base44.asServiceRole.entities.SystemLog.create({
          action: `Erro na fonte: ${source.name}`,
          details: err.message,
          log_type: 'error',
          source: 'collectLatestNews',
        });
      }
    }

    // Auto-process top priority items (max 3 per run to avoid timeout)
    let processed = 0;
    if (autoProcess && newItems.length > 0) {
      const toProcess = newItems.slice(0, 3);
      for (const item of toProcess) {
        try {
          await base44.asServiceRole.functions.invoke('processRawNews', { raw_id: item.id });
          processed++;
        } catch {
          // non-fatal
        }
      }
    }

    await base44.asServiceRole.entities.SystemLog.create({
      action: `Coleta automática concluída`,
      details: `Novas: ${collected} | Duplicadas: ${duplicates} | Processadas: ${processed} | Erros: ${errors}`,
      log_type: collected > 0 ? 'success' : 'info',
      source: 'collectLatestNews',
    });

    return Response.json({ success: true, collected, duplicates, processed, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});