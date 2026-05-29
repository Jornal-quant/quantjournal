import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TOPICS = [
  { topic: 'Ibovespa hoje - principais movimentos e destaques', category: 'bolsa' },
  { topic: 'Dólar hoje frente ao real - análise do câmbio', category: 'dolar' },
  { topic: 'Taxa Selic e perspectivas do Banco Central do Brasil', category: 'juros' },
  { topic: 'Bitcoin e criptomoedas - movimentos recentes do mercado', category: 'criptomoedas' },
  { topic: 'Economia brasileira - PIB, inflação e perspectivas', category: 'economia' },
  { topic: 'Petrobras - notícias, dividendos e produção de petróleo', category: 'empresas' },
  { topic: 'Federal Reserve - política monetária e impactos globais', category: 'internacional' },
  { topic: 'Commodities - petróleo, minério e ouro no mercado global', category: 'commodities' },
  { topic: 'Renda fixa no Brasil - Tesouro Direto, CDB e LCI', category: 'renda_fixa' },
  { topic: 'Vale, Gerdau e mineradoras brasileiras - análise setorial', category: 'empresas' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Pick a random topic
    const topicObj = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um jornalista financeiro sênior do portal FinanceNews AI. Pesquise e gere um artigo completo e atual sobre: "${topicObj.topic}".

Use informações atualizadas da internet. O artigo deve ser informativo, objetivo e útil para investidores brasileiros.

Retorne um JSON com:
- title: título SEO (máx 80 chars, inclua data ou "hoje" quando relevante)
- slug: URL amigável
- summary: resumo executivo (2-3 frases objetivas)
- what_happened: o que aconteceu (2-3 parágrafos detalhados)
- why_it_matters: por que importa para investidores (1-2 parágrafos)
- impacts: JSON com chaves "Bolsa", "Dólar", "Juros" e outras relevantes, cada valor é uma frase
- affected_companies: empresas afetadas separadas por vírgula (deixe vazio se não aplicável)
- tickers: tickers relacionados separados por vírgula
- conclusion: conclusão com perspectiva prática para investidores
- tags: 5-8 keywords SEO separadas por vírgula
- meta_title: meta title SEO (máx 60 chars)
- meta_description: meta description (máx 160 chars)
- relevance: "baixa", "media", "alta" ou "urgente"
- country: país principal relacionado
- sector: setor econômico
- source: fonte provável`,
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
          relevance: { type: 'string' },
          country: { type: 'string' },
          sector: { type: 'string' },
          source: { type: 'string' },
        },
      },
    });

    const article = await base44.asServiceRole.entities.Article.create({
      ...result,
      impacts: JSON.stringify(result.impacts || {}),
      category: topicObj.category,
      status: 'publicado',
      is_featured: result.relevance === 'urgente' || result.relevance === 'alta',
      views: 0,
    });

    await base44.asServiceRole.entities.SystemLog.create({
      action: `Auto-publicação: ${result.title}`,
      details: `Categoria: ${topicObj.category} | Relevância: ${result.relevance}`,
      log_type: 'success',
      source: 'autoPublishNews',
    });

    return Response.json({
      success: true,
      article_id: article.id,
      title: result.title,
      category: topicObj.category,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});