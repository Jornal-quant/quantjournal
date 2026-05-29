import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TOPICS = [
  { topic: 'Ibovespa — análise dos movimentos mais recentes e perspectivas para os próximos pregões', category: 'bolsa' },
  { topic: 'Dólar frente ao real — fatores que movem o câmbio e impacto para investidores', category: 'dolar' },
  { topic: 'Decisão do COPOM sobre a taxa Selic — implicações para renda fixa e bolsa', category: 'juros' },
  { topic: 'Bitcoin e mercado cripto — análise técnica, fluxos institucionais e perspectivas', category: 'criptomoedas' },
  { topic: 'Inflação no Brasil — leitura do IPCA, componentes e perspectivas para a política monetária', category: 'economia' },
  { topic: 'Petrobras — produção, dividendos e estratégia da companhia no cenário atual', category: 'empresas' },
  { topic: 'Federal Reserve — sinais sobre juros americanos e impacto nos mercados globais', category: 'internacional' },
  { topic: 'Commodities — petróleo, minério de ferro e ouro: análise de oferta, demanda e preços', category: 'commodities' },
  { topic: 'Tesouro Direto e renda fixa — oportunidades com a curva de juros atual', category: 'renda_fixa' },
  { topic: 'Vale — produção de minério, resultados e perspectivas para o setor de mineração', category: 'empresas' },
  { topic: 'PIB brasileiro — crescimento, setores em destaque e projeções dos principais bancos', category: 'economia' },
  { topic: 'Mercado de ações americano — S&P 500, Nasdaq e setores em destaque', category: 'internacional' },
];

const EDITORIAL_PROMPT = `Você é editor-chefe de um portal financeiro no nível Bloomberg/Valor Econômico. Escreva como um profissional de redação financeira sênior.

REGRAS EDITORIAIS OBRIGATÓRIAS:
1. NUNCA insira URLs, links ou endereços web no corpo do texto
2. NUNCA use linguagem vaga como "pode impactar", "tende a", "alguns analistas dizem"
3. SEMPRE cite fontes de forma natural: "segundo o Banco Central", "conforme dados da B3", "de acordo com o Fed"
4. Separe claramente FATOS de INTERPRETAÇÃO
5. Inclua números e dados específicos quando possível
6. Escreva com autoridade e precisão — o leitor é um investidor profissional
7. Cada parágrafo deve responder: o que, quem, quando, quanto, por quê
8. Evite repetição de palavras e frases entre seções`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const topicObj = TOPICS[Math.floor(Math.random() * TOPICS.length)];

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${EDITORIAL_PROMPT}

Tema: "${topicObj.topic}"

Gere um artigo financeiro completo e profissional. Use dados reais e atuais da internet.

Retorne JSON com:
- title: título editorial impactante (máx 80 chars, sem clickbait)
- slug: URL amigável em português sem acentos
- summary: lede jornalístico em 2-3 frases — responda o mais importante imediatamente
- what_happened: o que aconteceu — 3 parágrafos factuais e densos, com dados específicos. SEM URLs no texto.
- why_it_matters: por que isso importa — análise para o investidor, com contexto macro e micro. SEM URLs.
- impacts: objeto com chaves "Bolsa", "Dólar", "Juros", "Cripto", "Commodities" — cada valor é 1 frase assertiva de impacto
- affected_companies: empresas afetadas separadas por vírgula (apenas se aplicável)
- tickers: tickers B3/NYSE separados por vírgula (ex: PETR4, VALE3, IBOV)
- conclusion: perspectiva para o investidor — O que fazer? O que monitorar? Sem ser genérico.
- investor_summary: 3 bullets separados por | — (1) Impacto principal (2) Ativos afetados (3) O que observar agora
- key_takeaways: 3-4 pontos-chave do artigo separados por | (frases curtas e assertivas)
- assets_to_watch: 3-6 tickers/ativos específicos a monitorar, separados por vírgula
- source_links: array JSON com fontes consultadas [{name: "Reuters", url: ""}, {name: "B3", url: ""}] — URLs opcionais, nome obrigatório
- tags: 5-8 keywords SEO separadas por vírgula
- meta_title: título SEO (máx 60 chars)
- meta_description: meta description (máx 160 chars)
- social_summary: resumo para Twitter/Telegram (máx 280 chars, inclua emojis e hashtags relevantes)
- sentiment: "positivo", "negativo", "neutro" ou "misto"
- impact_level: "baixo", "medio", "alto" ou "critico"
- relevance: "baixa", "media", "alta" ou "urgente"
- country: país principal
- sector: setor econômico
- source: nome da fonte principal (ex: "Reuters", "B3", "Banco Central do Brasil")
- ai_confidence: número de 70 a 95`,
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
          social_summary: { type: 'string' }, sentiment: { type: 'string' }, impact_level: { type: 'string' },
          relevance: { type: 'string' }, country: { type: 'string' }, sector: { type: 'string' },
          source: { type: 'string' }, ai_confidence: { type: 'number' },
        },
      },
    });

    const article = await base44.asServiceRole.entities.Article.create({
      ...result,
      impacts: JSON.stringify(result.impacts || {}),
      source_links: JSON.stringify(result.source_links || []),
      category: topicObj.category,
      status: 'publicado',
      is_featured: result.relevance === 'urgente' || result.relevance === 'alta',
      is_breaking: result.relevance === 'urgente',
      premium_only: false,
      views: 0,
      ai_confidence: result.ai_confidence || 80,
    });

    await base44.asServiceRole.entities.SystemLog.create({
      action: `Auto-publicado: ${result.title}`,
      details: `Cat: ${topicObj.category} | Relevância: ${result.relevance} | Confiança IA: ${result.ai_confidence || 80}%`,
      log_type: 'success',
      source: 'autoPublishNews',
    });

    return Response.json({ success: true, article_id: article.id, title: result.title, category: topicObj.category });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});