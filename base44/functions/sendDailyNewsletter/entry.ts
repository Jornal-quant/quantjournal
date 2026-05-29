import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date().toISOString().slice(0, 10);
    const allArticles = await base44.asServiceRole.entities.Article.filter(
      { status: 'publicado' },
      '-created_date',
      100
    );

    const todayArticles = allArticles.filter(
      (a) => a.created_date && a.created_date.startsWith(today)
    );

    const articlesToUse = todayArticles.length > 0 ? todayArticles : allArticles.slice(0, 8);

    const topArticles = articlesToUse.slice(0, 8);

    const articlesList = topArticles
      .map((a, i) => `${i + 1}. ${a.title}\n   ${a.summary || ''}`)
      .join('\n\n');

    const emailBody = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é editor do portal FinanceNews AI. Crie um email de newsletter diária em HTML elegante baseado nas notícias abaixo.

Notícias do dia:
${articlesList}

Crie um HTML completo e bem formatado com:
- Cabeçalho com o nome "FinanceNews AI" e data atual
- Seção "Bom dia, investidor!" com saudação
- Lista das principais notícias com título e resumo de cada uma
- Seção de "O que monitorar hoje" com 3 pontos
- Rodapé com aviso de que não é recomendação de investimento

Use cores: azul (#3b82f6) para cabeçalho, fundo cinza claro (#f8fafc), cards brancos, tipografia clara.`,
    });

    const subscribers = await base44.asServiceRole.entities.NewsletterSubscriber.filter({
      is_active: true,
    });

    let sentCount = 0;
    for (const sub of subscribers.slice(0, 50)) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: sub.email,
        subject: `📊 FinanceNews AI — Resumo do dia ${new Date().toLocaleDateString('pt-BR')}`,
        body: emailBody,
      });
      sentCount++;
    }

    await base44.asServiceRole.entities.SystemLog.create({
      action: `Newsletter enviada para ${sentCount} assinantes`,
      details: `${topArticles.length} notícias incluídas`,
      log_type: 'success',
      source: 'sendDailyNewsletter',
    });

    return Response.json({ success: true, sent: sentCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});