// Testa os coletores de notícias por API contra os endpoints reais.
// Uso:
//   FINNHUB_API_KEY=xxx node scripts/test-news-apis.mjs
//   GNEWS_API_KEY=yyy  node scripts/test-news-apis.mjs
// (defina as duas pra testar ambas de uma vez)
//
// Não imprime a key; só mostra status, total de itens e os 3 primeiros títulos.

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  return response.json();
}

async function testFinnhub() {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return console.log('› Finnhub: FINNHUB_API_KEY ausente, pulando.\n');
  try {
    const data = await fetchJson(`https://finnhub.io/api/v1/news?category=general&token=${token}`);
    const items = (Array.isArray(data) ? data : [])
      .map((i) => ({ title: i.headline, link: i.url, source: i.source }))
      .filter((i) => i.title && i.link);
    console.log(`✓ Finnhub: ${items.length} itens válidos.`);
    items.slice(0, 3).forEach((i, n) => console.log(`   ${n + 1}. [${i.source}] ${i.title}`));
    console.log();
  } catch (err) {
    console.log(`✗ Finnhub falhou: ${err.message}\n`);
  }
}

async function testGNews() {
  const token = process.env.GNEWS_API_KEY;
  if (!token) return console.log('› GNews: GNEWS_API_KEY ausente, pulando.\n');
  try {
    const data = await fetchJson(
      `https://gnews.io/api/v4/top-headlines?category=business&lang=pt&country=br&max=25&apikey=${token}`,
    );
    const items = (data?.articles || [])
      .map((i) => ({ title: i.title, link: i.url, source: i.source?.name }))
      .filter((i) => i.title && i.link);
    console.log(`✓ GNews Brasil: ${items.length} itens válidos.`);
    items.slice(0, 3).forEach((i, n) => console.log(`   ${n + 1}. [${i.source}] ${i.title}`));
    console.log();
  } catch (err) {
    console.log(`✗ GNews falhou: ${err.message}\n`);
  }
}

await testFinnhub();
await testGNews();
