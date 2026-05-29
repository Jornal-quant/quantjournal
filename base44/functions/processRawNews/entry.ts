import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { raw_id } = await req.json();
    if (!raw_id) {
      return Response.json({ error: 'raw_id is required' }, { status: 400 });
    }

    const rawItems = await base44.asServiceRole.entities.RawNewsFeed.filter({ id: raw_id });
    const raw = rawItems[0];
    if (!raw) {
      return Response.json({ error: 'RawNewsFeed not found' }, { status: 404 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um jornalista financeiro sênior. Com base na notícia bruta abaixo, gere um artigo completo e profissional para o portal FinanceNews AI.

Título original: "${raw.raw_title}"
Fonte: ${raw.source_name || 'Desconhecida'}
Conteúdo bruto:
${raw.raw_content || '(sem conteúdo bruto - use apenas o título e pesquise na internet)'}

Gere um JSON completo com:
- title: título SEO otimizado (máx 80 chars)
- slug: URL amigável em português, sem acentos, com hífens
- summary: resumo executivo em 2-3 frases objetivas
- what_happened: o que aconteceu em detalhes (2-3 parágrafos ricos)
- why_it_matters: por que isso importa para investidores brasileiros (1-2 parágrafos)
- impacts: objeto JSON com chaves "Bolsa", "Dólar", "Juros", "Cripto" e outros relevantes, cada valor uma frase de impacto
- affected_companies: empresas afetadas separadas por vírgula (ex: "Petrobras, Vale, Itaú")
- tickers: tickers relacionados separados por vírgula (ex: "PETR4, VALE3")
- conclusion: conclusão prática e perspectiva para o investidor
- tags: 5-8 keywords SEO separadas por vírgula
- meta_title: título para SEO (máx 60 chars)
- meta_description: descrição para SEO (máx 160 chars)
- category: uma das opções: "bolsa", "renda_fixa", "juros", "dolar", "economia", "criptomoedas", "commodities", "empresas", "internacional"
- relevance: "baixa", "media", "alta" ou "urgente"
- country: país principal (ex: "Brasil", "EUA")
- sector: setor econômico (ex: "Energia", "Financeiro")`,
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
          category: { type: 'string' },
          relevance: { type: 'string' },
          country: { type: 'string' },
          sector: { type: 'string' },
        },
      },
    });

    const article = await base44.asServiceRole.entities.Article.create({
      ...result,
      impacts: JSON.stringify(result.impacts || {}),
      source: raw.source_name || 'Externo',
      source_url: raw.source_url || '',
      status: 'publicado',
      is_featured: result.relevance === 'urgente' || result.relevance === 'alta',
      views: 0,
    });

    // Mark raw as processed
    await base44.asServiceRole.entities.RawNewsFeed.update(raw_id, {
      processed: true,
      article_id: article.id,
    });

    await base44.asServiceRole.entities.SystemLog.create({
      action: `Raw processado → Artigo: ${result.title}`,
      details: `Fonte: ${raw.source_name} | Categoria: ${result.category} | Relevância: ${result.relevance}`,
      log_type: 'success',
      source: 'processRawNews',
    });

    return Response.json({ success: true, article_id: article.id, title: result.title });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});