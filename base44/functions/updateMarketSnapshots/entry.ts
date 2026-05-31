import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Atualiza a entidade MarketSnapshot com cotações REAIS de mercado.
 *
 * Substitui a antiga abordagem "IA" (que alucinava preços — ex.: Ouro a US$ 418).
 * Cada fonte é isolada em try/catch: se uma falhar, as demais continuam.
 * Só grava valores dentro de faixas plausíveis (sanity check) para nunca
 * exibir dado quebrado no site.
 */

// Faixas plausíveis por símbolo (espelha src/lib/utils.js isSaneSnapshot)
const SANITY: Record<string, [number, number]> = {
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

function isSane(symbol: string, price: number) {
  if (!Number.isFinite(price)) return false;
  const r = SANITY[symbol];
  return !r || (price >= r[0] && price <= r[1]);
}

type Quote = { symbol: string; name: string; price: number; change_percent: number; market_type: string };

async function fetchJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.json();
}

// USD/BRL e EUR/BRL — AwesomeAPI (grátis, sem chave), traz pctChange do dia
async function fetchFx(): Promise<Quote[]> {
  const data = await fetchJson('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL');
  const out: Quote[] = [];
  if (data?.USDBRL) out.push({ symbol: 'USD/BRL', name: 'Dólar', price: parseFloat(data.USDBRL.bid), change_percent: parseFloat(data.USDBRL.pctChange) || 0, market_type: 'fx' });
  if (data?.EURBRL) out.push({ symbol: 'EUR/BRL', name: 'Euro', price: parseFloat(data.EURBRL.bid), change_percent: parseFloat(data.EURBRL.pctChange) || 0, market_type: 'fx' });
  return out;
}

// BTC e ETH — CoinGecko (grátis, sem chave), com variação 24h
async function fetchCrypto(): Promise<Quote[]> {
  const data = await fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
  const out: Quote[] = [];
  if (data?.bitcoin) out.push({ symbol: 'BTC', name: 'Bitcoin', price: data.bitcoin.usd, change_percent: +(data.bitcoin.usd_24h_change ?? 0).toFixed(2), market_type: 'crypto' });
  if (data?.ethereum) out.push({ symbol: 'ETH', name: 'Ethereum', price: data.ethereum.usd, change_percent: +(data.ethereum.usd_24h_change ?? 0).toFixed(2), market_type: 'crypto' });
  return out;
}

// SELIC meta (% a.a.) — API SGS do Banco Central, série 432
async function fetchSelic(): Promise<Quote[]> {
  const data = await fetchJson('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
  const valor = parseFloat(data?.[0]?.valor);
  return Number.isFinite(valor) ? [{ symbol: 'SELIC', name: 'SELIC a.a.', price: valor, change_percent: 0, market_type: 'rate' }] : [];
}

// Índices e commodities — Yahoo Finance chart (sem chave), variação vs. fechamento anterior
const YAHOO = [
  { symbol: 'IBOV', y: '^BVSP', name: 'Ibovespa',     market_type: 'index' },
  { symbol: 'SPX',  y: '^GSPC', name: 'S&P 500',      market_type: 'index' },
  { symbol: 'GOLD', y: 'GC=F',  name: 'Ouro',         market_type: 'commodity' },
  { symbol: 'OIL',  y: 'CL=F',  name: 'Petróleo WTI', market_type: 'commodity' },
];

async function fetchYahoo(): Promise<Quote[]> {
  const out: Quote[] = [];
  for (const it of YAHOO) {
    try {
      const data = await fetchJson(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(it.y)}?range=5d&interval=1d`,
        { 'User-Agent': 'Mozilla/5.0' },
      );
      const meta = data?.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice;
      const prev = meta?.chartPreviousClose ?? meta?.previousClose;
      if (Number.isFinite(price)) {
        const change = Number.isFinite(prev) && prev ? +(((price - prev) / prev) * 100).toFixed(2) : 0;
        out.push({ symbol: it.symbol, name: it.name, price, change_percent: change, market_type: it.market_type });
      }
    } catch { /* fonte isolada — ignora e segue */ }
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const results = await Promise.allSettled([fetchFx(), fetchCrypto(), fetchSelic(), fetchYahoo()]);
    const quotes: Quote[] = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

    // Mantém só valores plausíveis
    const sane = quotes.filter((q) => isSane(q.symbol, q.price));

    const existing = await base44.asServiceRole.entities.MarketSnapshot.list();
    const bySymbol = new Map(existing.map((s: any) => [s.symbol, s]));

    let updated = 0;
    let created = 0;
    const now = new Date().toISOString();

    for (const q of sane) {
      const payload = { ...q, price: +q.price, updated_at: now };
      const found = bySymbol.get(q.symbol);
      if (found) {
        await base44.asServiceRole.entities.MarketSnapshot.update(found.id, payload);
        updated++;
      } else {
        await base44.asServiceRole.entities.MarketSnapshot.create(payload);
        created++;
      }
    }

    const skipped = quotes.length - sane.length;
    await base44.asServiceRole.entities.SystemLog.create({
      action: 'Cotações atualizadas',
      details: `Atualizadas: ${updated} | Criadas: ${created} | Descartadas (fora da faixa): ${skipped}`,
      log_type: sane.length > 0 ? 'success' : 'error',
      source: 'updateMarketSnapshots',
    });

    return Response.json({ success: true, updated, created, skipped, symbols: sane.map((q) => q.symbol) });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
