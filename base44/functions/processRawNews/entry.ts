import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const EDITORIAL_PROMPT = `Você é editor-chefe de um portal financeiro no nível Bloomberg/Valor Econômico. Escreva como um profissional de redação financeira sênior.

REGRAS EDITORIAIS OBRIGATÓRIAS:
1. NUNCA insira URLs, links brutos ou endereços web no corpo do texto
2. NUNCA use linguagem vaga como "pode impactar", "tende a", "alguns analistas dizem"
3. Cite fontes de forma natural no corpo do texto: "segundo o Banco Central", "conforme dados da B3"
4. Separe claramente FATOS de INTERPRETAÇÃO
5. Inclua números e dados específicos
6. Escreva com autoridade — o leitor é um investidor profissional
7. Cada parágrafo deve ter substância: o que, quem, quando, quanto, por quê`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { raw_id } = body;

    let rawItems = [];
    if (raw_id) {
      rawItems = await base44.asServiceRole.entities.RawNewsFeed.filter({ id: raw_id });
    } else {
      rawItems = await base44.asServiceRole.entities.RawNewsFeed.filter({ status: 'pending' }, '-created_date', 1);
    }

    if (rawItems.length === 0) {
      return Response.json({ success: true, message: 'Nenhum item pendente', processed: 0 });
    }

    const rawItem = rawItems[0];
    await base44.asServiceRole.entities.RawNewsFeed.update(rawItem.id, { status: 'processing' });

    // Duplicate check against existing articles
    const existing = await base44.asServiceRole.entities.Article.list('-created_date', 100);
    const titleKey = rawItem.raw_title?.toLowerCase().slice(0, 40);
    if (existing.some((a) => a.title?.toLowerCase().slice(0, 40) === titleKey)) {
      await base44.asServiceRole.entities.RawNewsFeed.update(rawItem.id, { status: 'duplicate' });
      return Response.json({ success: true, message: 'Duplicada', processed: 0 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${EDITORIAL_PROMPT}

Com base na notícia abaixo, gere um artigo financeiro completo e profissional para o portal FinanceNews AI.

Notícia original:
Título: "${rawItem.raw_title}"
Conteúdo: ${rawItem.raw_content || '(use o título e pesquise na internet para complementar)'}
Fonte: ${rawItem.source_name || 'Não identificada'}
URL: ${rawItem.source_url || ''}

IMPORTANTE: Não copie a notícia bruta. Transforme em artigo editorial completo, com análise, contexto e perspectiva para investidores brasileiros.

Retorne JSON com:
- title: título editorial (máx 80 chars)
- slug: URL amigável
- summary: lede jornalístico em 2-3 frases (o mais importante primeiro)
- what_happened: 3 parágrafos factuais e densos. Cite a fonte naturalmente (ex: "segundo a Reuters"). SEM URLs no texto.
- why_it_matters: análise para o investidor — por que isso importa, quem ganha, quem perde
- impacts: objeto com "Bolsa", "Dólar", "Juros", "Cripto", "Commodities" — cada valor é 1 frase assertiva
- affected_companies: empresas separadas por vírgula
- tickers: tickers B3/NYSE separados por vírgula
- conclusion: perspectiva prática — o que monitorar, qual postura adotar
- investor_summary: 3 bullets separados por | — (1) Impacto principal (2) Ativos afetados (3) O que observar
- key_takeaways: 3-4 pontos-chave separados por | (frases curtas)
- assets_to_watch: 3-6 tickers a monitorar, separados por vírgula
- source_links: array JSON [{name, url}] com as fontes consultadas
- tags: 5-8 keywords SEO separadas por vírgula
- meta_title: (máx 60 chars)
- meta_description: (máx 160 chars)
- social_summary: resumo Twitter/Telegram (máx 280 chars, emojis e hashtags)
- category: bolsa|renda_fixa|juros|dolar|economia|criptomoedas|commodities|empresas|internacional
- sentiment: positivo|negativo|neutro|misto
- impact_level: baixo|medio|alto|critico
- relevance: baixa|media|alta|urgente
- country: país principal
- sector: setor econômico
- source: nome da fonte principal
- ai_confidence: número 0-100 (sua confiança na qualidade e veracidade do artigo)`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' }, slug: { type: 'string' }, summary: { type: 'string' },
          what_happened: { type: 'string' }, why_it_matters: { type: 'string' },
          impacts: { type: 'object' }, affected_companies: { type: 'string' }, tickers: { type: 'string' },
          conclusion: { type: 'string' }, investor_summary: { type: 'string' },
          key_takeaways: { type: 'string' }, assets_to_watch: { type: 'string' },
          source_links: { type: 'array', items: { type: 'object' } },
          tags: { type: 'string' }, meta_title: { type: 'string' }, meta_description: { type: 'string' },
          social_summary: { type: 'string' }, category: { type: 'string' },
          sentiment: { type: 'string' }, impact_level: { type: 'string' },
          relevance: { type: 'string' }, country: { type: 'string' }, sector: { type: 'string' },
          source: { type: 'string' }, ai_confidence: { type: 'number' },
        },
      },
    });

    const confidence = result.ai_confidence || 70;
    const autoPublish = confidence >= 65;

    const article = await base44.asServiceRole.entities.Article.create({
      ...result,
      impacts: JSON.stringify(result.impacts || {}),
      source_links: JSON.stringify(result.source_links || []),
      source: result.source || rawItem.source_name,
      source_url: rawItem.source_url,
      status: autoPublish ? 'publicado' : 'revisao',
      is_featured: (result.relevance === 'urgente' || result.relevance === 'alta') && autoPublish,
      is_breaking: result.relevance === 'urgente',
      premium_only: false,
      views: 0,
      ai_confidence: confidence,
    });

    await base44.asServiceRole.entities.RawNewsFeed.update(rawItem.id, {
      status: 'processed',
      article_id: article.id,
    });

    await base44.asServiceRole.entities.SystemLog.create({
      action: `Processado: ${result.title}`,
      details: `IA: ${confidence}% | Status: ${autoPublish ? 'publicado' : 'revisão'} | Cat: ${result.category}`,
      log_type: 'success',
      source: 'processRawNews',
    });

    return Response.json({ success: true, processed: 1, article_id: article.id, status: autoPublish ? 'publicado' : 'revisao', ai_confidence: confidence });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});