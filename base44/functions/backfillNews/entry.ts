import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// 120 topics spread across 6 categories = ~20 per category
const BACKFILL_TOPICS = [
  // BOLSA (20)
  { topic: 'Ibovespa encerra semana — análise dos principais movimentos e destaques do índice', category: 'bolsa' },
  { topic: 'Ações da Petrobras (PETR4) — análise de dividendos, produção e perspectivas', category: 'bolsa' },
  { topic: 'Vale (VALE3) e minério de ferro — impacto nos preços e ações na B3', category: 'bolsa' },
  { topic: 'Itaú Unibanco (ITUB4) — resultados, lucro e perspectivas para o setor bancário', category: 'bolsa' },
  { topic: 'Nubank (ROXO3) e bancos digitais — crescimento e competição no setor financeiro', category: 'bolsa' },
  { topic: 'Magazine Luiza (MGLU3) e varejo brasileiro — e-commerce e desempenho recente', category: 'bolsa' },
  { topic: 'Embraer (EMBR3) — carteira de pedidos, receitas e perspectivas para aviação', category: 'bolsa' },
  { topic: 'WEG (WEGE3) — crescimento industrial e expansão internacional da empresa', category: 'bolsa' },
  { topic: 'Ambev (ABEV3) — resultados, volume de vendas e estratégia para 2026', category: 'bolsa' },
  { topic: 'BTG Pactual (BPAC11) — resultados do banco de investimentos e estratégia', category: 'bolsa' },
  { topic: 'Bradesco (BBDC4) — carteira de crédito, inadimplência e perspectivas 2026', category: 'bolsa' },
  { topic: 'Raízen e setor sucroenergético na bolsa brasileira — análise setorial', category: 'bolsa' },
  { topic: 'IFIX e fundos imobiliários — melhores FIIs, rendimentos e oportunidades', category: 'bolsa' },
  { topic: 'Small caps brasileiras — oportunidades em empresas de menor capitalização na B3', category: 'bolsa' },
  { topic: 'Eneva e setor de energia elétrica na bolsa — análise e perspectivas', category: 'bolsa' },
  { topic: 'Localiza (RENT3) e locadoras de veículos — desempenho e tendências do setor', category: 'bolsa' },
  { topic: 'IPOs e ofertas de ações na B3 em 2026 — mercado de capitais brasileiro', category: 'bolsa' },
  { topic: 'Gerdau (GGBR4) e siderurgia — produção de aço e perspectivas globais', category: 'bolsa' },
  { topic: 'Americanas — recuperação judicial, credores e o futuro da empresa', category: 'bolsa' },
  { topic: 'Análise técnica do Ibovespa — suportes, resistências e tendências atuais', category: 'bolsa' },

  // ECONOMIA (20)
  { topic: 'PIB brasileiro 2026 — crescimento, projeções e setores que mais crescem', category: 'economia' },
  { topic: 'Inflação IPCA no Brasil — resultado recente, componentes e impacto na economia', category: 'economia' },
  { topic: 'Desemprego no Brasil — taxa de desocupação, mercado de trabalho e perspectivas', category: 'economia' },
  { topic: 'Balança comercial do Brasil — exportações, importações e saldo externo', category: 'economia' },
  { topic: 'Reforma tributária no Brasil — mudanças, impactos para empresas e consumidores', category: 'economia' },
  { topic: 'Previdência social e reforma fiscal no Brasil — sustentabilidade das contas públicas', category: 'economia' },
  { topic: 'IGP-M e índices de inflação no Brasil — comparativo e impactos nos contratos', category: 'economia' },
  { topic: 'Contas públicas e dívida do governo federal — meta fiscal e ajustes necessários', category: 'economia' },
  { topic: 'Crédito e consumo das famílias no Brasil — inadimplência e tendências', category: 'economia' },
  { topic: 'Agronegócio brasileiro — exportações, safra e contribuição ao PIB', category: 'economia' },
  { topic: 'Investimentos estrangeiros no Brasil (IED) — fluxo e setores mais atrativos', category: 'economia' },
  { topic: 'Infraestrutura no Brasil — concessões, leilões e perspectivas para 2026', category: 'economia' },
  { topic: 'Renda per capita e desigualdade no Brasil — tendências econômicas recentes', category: 'economia' },
  { topic: 'Indústria brasileira — produção industrial, PMI e perspectivas setoriais', category: 'economia' },
  { topic: 'Varejo brasileiro — vendas no comércio, tendências e sazonalidade', category: 'economia' },
  { topic: 'Banco Central do Brasil — decisões de política monetária e comunicados recentes', category: 'economia' },
  { topic: 'Lula e agenda econômica do governo federal — políticas e impactos no mercado', category: 'economia' },
  { topic: 'Mercado de trabalho formal (CAGED) — geração de empregos no Brasil', category: 'economia' },
  { topic: 'Serviços e comércio no Brasil — setor que mais emprega e perspectivas', category: 'economia' },
  { topic: 'Economia digital no Brasil — fintechs, PIX e transformação financeira', category: 'economia' },

  // DÓLAR E JUROS (20)
  { topic: 'Taxa de câmbio USD/BRL — análise do dólar frente ao real e perspectivas', category: 'dolar' },
  { topic: 'Selic em 2026 — decisão do Copom, ciclo de juros e impactos na economia', category: 'juros' },
  { topic: 'Federal Reserve (Fed) — política monetária americana e impactos no mundo', category: 'juros' },
  { topic: 'Tesouro Direto — rentabilidade, melhores títulos e estratégia de investimento', category: 'renda_fixa' },
  { topic: 'Euro frente ao dólar e impactos para o Brasil — análise cambial', category: 'dolar' },
  { topic: 'CDB, LCI e LCA — comparativo de renda fixa e oportunidades para investidor', category: 'renda_fixa' },
  { topic: 'Dívida pública americana e crise fiscal dos EUA — impactos no dólar global', category: 'dolar' },
  { topic: 'Spread bancário no Brasil — alto custo do crédito e alternativas para investidores', category: 'juros' },
  { topic: 'Reservas internacionais do Brasil — proteção cambial e política do Banco Central', category: 'dolar' },
  { topic: 'Curva de juros no Brasil — DI futuro, expectativas e estratégias de investimento', category: 'juros' },
  { topic: 'Debentures e títulos privados — mercado de crédito corporativo no Brasil', category: 'renda_fixa' },
  { topic: 'Inflação americana (CPI) — impactos na política do Fed e no dólar global', category: 'juros' },
  { topic: 'Dólar forte e emergentes — impactos em Brasil, Argentina e mercados globais', category: 'dolar' },
  { topic: 'Yuan chinês e geopolítica — desdolarização e novas moedas de reserva', category: 'dolar' },
  { topic: 'Juros reais no Brasil — comparativo global e atratividade para estrangeiros', category: 'juros' },
  { topic: 'Poupança no Brasil — rendimento atual e comparativo com outras aplicações', category: 'renda_fixa' },
  { topic: 'BCE e política monetária europeia — taxas, inflação e perspectivas para o euro', category: 'juros' },
  { topic: 'Fundos de renda fixa — melhores gestoras e estratégias para 2026', category: 'renda_fixa' },
  { topic: 'Intervenção cambial do Banco Central — quando e como age no mercado de câmbio', category: 'dolar' },
  { topic: 'NTN-B e IPCA+ — por que os títulos indexados atraem investidores agora', category: 'renda_fixa' },

  // EMPRESAS (20)
  { topic: 'Resultados trimestrais das grandes empresas brasileiras — análise consolidada', category: 'empresas' },
  { topic: 'Fusões e aquisições no Brasil (M&A) — principais deals e impactos setoriais', category: 'empresas' },
  { topic: 'Apple (AAPL) — receita, iPhone e estratégia de crescimento global', category: 'empresas' },
  { topic: 'Microsoft (MSFT) — Azure, IA e dominância no mercado de computação em nuvem', category: 'empresas' },
  { topic: 'Amazon (AMZN) — AWS, marketplace e expansão no Brasil e na América Latina', category: 'empresas' },
  { topic: 'Tesla (TSLA) — veículos elétricos, Elon Musk e perspectivas para 2026', category: 'empresas' },
  { topic: 'Nvidia (NVDA) — chips de IA, demanda por GPUs e perspectivas de crescimento', category: 'empresas' },
  { topic: 'Google (Alphabet) — receita de publicidade, IA generativa e desafios regulatórios', category: 'empresas' },
  { topic: 'Meta Platforms — Instagram, WhatsApp e monetização de redes sociais', category: 'empresas' },
  { topic: 'Banco do Brasil (BBAS3) — lucro, dividendos e estratégia de crédito rural', category: 'empresas' },
  { topic: 'Caixa Econômica Federal — financiamentos habitacionais e papel social no Brasil', category: 'empresas' },
  { topic: 'Suzano e celulose brasileira — exportações e posição no mercado global', category: 'empresas' },
  { topic: 'JBS (JBSS3) e proteínas animais — exportação de carne e perspectivas globais', category: 'empresas' },
  { topic: 'Totvs e empresas de tecnologia brasileiras — SaaS, ERP e crescimento', category: 'empresas' },
  { topic: 'Hapvida e Intermédica — planos de saúde, sinistralidade e fusão pós-pandemia', category: 'empresas' },
  { topic: 'Raia Drogasil e farmácias — consolidação do setor de saúde no Brasil', category: 'empresas' },
  { topic: 'Eletrobras — privatização, tarifas e perspectivas para o setor elétrico', category: 'empresas' },
  { topic: 'Copel e Cemig — distribuidoras de energia e impacto das concessões no setor', category: 'empresas' },
  { topic: 'Via Varejo/Grupo Casas Bahia — reestruturação e futuro do varejo físico', category: 'empresas' },
  { topic: 'Startups e ecossistema de venture capital no Brasil — principais rodadas 2026', category: 'empresas' },

  // INTERNACIONAL (20)
  { topic: 'Guerra comercial EUA-China — tarifas, restrições e impactos globais', category: 'internacional' },
  { topic: 'China e desaceleração econômica — impactos em commodities e mercados emergentes', category: 'internacional' },
  { topic: 'Geopolítica e mercados — conflitos globais e impacto nos preços dos ativos', category: 'internacional' },
  { topic: 'Economia americana em 2026 — crescimento, emprego e perspectivas', category: 'internacional' },
  { topic: 'Zona do Euro — recessão, inflação e política do BCE', category: 'internacional' },
  { topic: 'Japão e política monetária — fim da era de juros zero e impactos globais', category: 'internacional' },
  { topic: 'Índia como potência emergente — crescimento econômico e mercado de capitais', category: 'internacional' },
  { topic: 'Crise da dívida em países emergentes — Argentina, Sri Lanka e vulnerabilidades', category: 'internacional' },
  { topic: 'BRICS e nova ordem econômica global — impactos no dólar e no Brasil', category: 'internacional' },
  { topic: 'Petróleo e OPEP+ — decisões de produção e impacto no preço do barril', category: 'internacional' },
  { topic: 'Transição energética global — renováveis, hidrogênio verde e investimentos', category: 'internacional' },
  { topic: 'Eleições nos EUA e impacto nos mercados financeiros globais', category: 'internacional' },
  { topic: 'Banco Mundial e FMI — perspectivas para a economia global em 2026', category: 'internacional' },
  { topic: 'Crise bancária global — Silicon Valley Bank, Credit Suisse e lições aprendidas', category: 'internacional' },
  { topic: 'Supply chain global — reestruturação de cadeias de fornecimento pós-pandemia', category: 'internacional' },
  { topic: 'Regulação de big techs no mundo — antitrust, privacidade e IA', category: 'internacional' },
  { topic: 'Mercado imobiliário global — crise na China, alta de juros e perspectivas', category: 'internacional' },
  { topic: 'Automação e IA no mercado de trabalho — impactos econômicos e sociais', category: 'internacional' },
  { topic: 'América Latina em 2026 — perspectivas econômicas para Brasil, México e Argentina', category: 'internacional' },
  { topic: 'Mudanças climáticas e impacto econômico — carbono, ESG e regulações globais', category: 'internacional' },

  // CRIPTOMOEDAS E COMMODITIES (20)
  { topic: 'Bitcoin (BTC) em 2026 — análise de preço, halving e perspectivas do mercado cripto', category: 'criptomoedas' },
  { topic: 'Ethereum (ETH) — proof of stake, DeFi e perspectivas para o ecossistema', category: 'criptomoedas' },
  { topic: 'Regulação de criptomoedas no Brasil e no mundo — CVM, SEC e novos marcos', category: 'criptomoedas' },
  { topic: 'Stablecoins e o futuro do dinheiro digital — CBDC, DREX e pagamentos', category: 'criptomoedas' },
  { topic: 'DeFi e finanças descentralizadas — protocolos, riscos e oportunidades', category: 'criptomoedas' },
  { topic: 'ETF de Bitcoin nos EUA — impacto no mercado e adoção institucional de cripto', category: 'criptomoedas' },
  { topic: 'Altcoins e mercado cripto — Solana, Ripple e projetos de destaque em 2026', category: 'criptomoedas' },
  { topic: 'Petróleo Brent e WTI — análise de preços, oferta, demanda e perspectivas', category: 'commodities' },
  { topic: 'Ouro como ativo de proteção — preço recorde e papel na carteira de investimentos', category: 'commodities' },
  { topic: 'Soja e grãos brasileiros — safra, preços e exportações para China e mundo', category: 'commodities' },
  { topic: 'Minério de ferro e aço — preços globais e impacto em Vale e siderúrgicas', category: 'commodities' },
  { topic: 'Cobre e metais industriais — demanda da transição energética e perspectivas', category: 'commodities' },
  { topic: 'Açúcar e etanol no Brasil — mercado global e impactos no setor sucroenergético', category: 'commodities' },
  { topic: 'Gás natural e GNL — mercado global, geopolítica e preços pós-conflito na Europa', category: 'commodities' },
  { topic: 'Lítio e minerais críticos — corrida global para baterias e veículos elétricos', category: 'commodities' },
  { topic: 'Commodities agrícolas — café, milho, algodão e perspectivas para 2026', category: 'commodities' },
  { topic: 'Mercado de carbono — créditos, precificação e oportunidades de investimento', category: 'commodities' },
  { topic: 'Web3 e blockchain além das criptomoedas — tokenização de ativos reais', category: 'criptomoedas' },
  { topic: 'Mining de criptomoedas — energia, sustentabilidade e concentração do mercado', category: 'criptomoedas' },
  { topic: 'Prata e metais preciosos — comparativo com ouro e perspectivas de mercado', category: 'commodities' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 5; // How many to generate per call
    const startIndex = body.start_index || 0;

    const batch = BACKFILL_TOPICS.slice(startIndex, startIndex + batchSize);
    if (batch.length === 0) {
      return Response.json({ success: true, message: 'Todos os tópicos já processados', generated: 0, total_topics: BACKFILL_TOPICS.length });
    }

    // Get existing article titles to avoid duplicates
    const existing = await base44.asServiceRole.entities.Article.list('-created_date', 200);
    const existingTitles = new Set(existing.map((a) => a.title?.toLowerCase().slice(0, 40)));

    let generated = 0;
    const results = [];

    for (const topicObj of batch) {
      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Você é um jornalista financeiro sênior do portal FinanceNews AI. Gere um artigo completo, detalhado e informativo sobre: "${topicObj.topic}".

Use informações reais e atuais. O artigo deve ser profissional, objetivo e útil para investidores brasileiros.

IMPORTANTE: Gere conteúdo original e detalhado, não genérico. Use dados e informações específicas.

Retorne JSON com:
- title: título SEO atrativo em português (máx 80 chars)
- slug: URL amigável
- summary: resumo executivo em 2-3 frases objetivas e informativas
- what_happened: o que aconteceu — 2-3 parágrafos detalhados com fatos específicos
- why_it_matters: por que importa para investidores brasileiros — 1-2 parágrafos concretos
- impacts: objeto com chaves "Bolsa", "Dólar", "Juros", "Cripto", "Commodities" — cada valor é uma frase de impacto
- affected_companies: empresas afetadas separadas por vírgula (só se aplicável)
- tickers: tickers B3/NYSE/NASDAQ relacionados separados por vírgula
- conclusion: conclusão prática com perspectiva para investidores
- tags: 5-8 keywords SEO separadas por vírgula
- meta_title: meta title SEO (máx 60 chars)
- meta_description: meta description (máx 160 chars)
- social_summary: resumo curto para Twitter/Telegram (máx 280 chars, inclua emojis e hashtags)
- relevance: "baixa", "media", "alta" ou "urgente"
- country: país principal
- sector: setor econômico
- source: fonte de referência (Yahoo Finance, Reuters, Valor Econômico, etc)
- ai_confidence: número de 70 a 95 (sua confiança na qualidade do artigo)`,
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              slug: { type: 'string' },
              summary: { type: 'string' },
              what_happened: { type: 'string' },
              why_it_matters: { type: 'string' },
              impacts: { type: 'object' },
              affected_companies: { type: 'string' },
              tickers: { type: 'string' },
              conclusion: { type: 'string' },
              tags: { type: 'string' },
              meta_title: { type: 'string' },
              meta_description: { type: 'string' },
              social_summary: { type: 'string' },
              relevance: { type: 'string' },
              country: { type: 'string' },
              sector: { type: 'string' },
              source: { type: 'string' },
              ai_confidence: { type: 'number' },
            },
          },
        });

        // Dedup check
        const titleKey = result.title?.toLowerCase().slice(0, 40);
        if (existingTitles.has(titleKey)) {
          results.push({ topic: topicObj.topic, skipped: true, reason: 'duplicate' });
          continue;
        }
        existingTitles.add(titleKey);

        const article = await base44.asServiceRole.entities.Article.create({
          ...result,
          impacts: JSON.stringify(result.impacts || {}),
          category: topicObj.category,
          status: 'publicado',
          is_featured: result.relevance === 'urgente' || result.relevance === 'alta',
          is_breaking: result.relevance === 'urgente',
          premium_only: false,
          views: 0,
          ai_confidence: result.ai_confidence || 80,
          source_quality: 'high',
        });

        generated++;
        results.push({ topic: topicObj.topic, article_id: article.id, title: result.title, category: topicObj.category });
      } catch (err) {
        results.push({ topic: topicObj.topic, error: err.message });
      }
    }

    await base44.asServiceRole.entities.SystemLog.create({
      action: `Backfill: ${generated} artigos gerados (índice ${startIndex}-${startIndex + batchSize})`,
      details: `Total de tópicos: ${BACKFILL_TOPICS.length} | Gerados: ${generated}`,
      log_type: 'success',
      source: 'backfillNews',
    });

    return Response.json({
      success: true,
      generated,
      next_index: startIndex + batchSize,
      total_topics: BACKFILL_TOPICS.length,
      has_more: startIndex + batchSize < BACKFILL_TOPICS.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});