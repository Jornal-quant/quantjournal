// Dispara a atualização de cotações no servidor enquanto há visitantes no site.
// É "fire-and-forget": não bloqueia a renderização e ignora erros silenciosamente
// (o servidor só atualiza de fato se as cotações estiverem velhas — ver
// refreshQuotesIfStale em api/functions/[name].js).
//
// Throttle por aba: no máximo 1 disparo a cada 2 min por navegador, para não
// inundar o endpoint mesmo com vários componentes montando ao mesmo tempo.
let lastTrigger = 0;
const BROWSER_THROTTLE_MS = 2 * 60 * 1000;

export function triggerQuotesRefresh() {
  const now = Date.now();
  if (now - lastTrigger < BROWSER_THROTTLE_MS) return;
  lastTrigger = now;

  fetch('/api/functions/refreshQuotesIfStale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    keepalive: true,
  }).catch(() => {
    // Silencioso de propósito: se o endpoint não existir (runtime base44) ou
    // falhar, a UI continua mostrando os dados que já tem.
  });
}

// Mesmo padrão das cotações, mas para NOTÍCIAS. O cron do GitHub Actions é
// estrangulado no plano gratuito, então os visitantes mantêm o jornal vivo:
// ao abrir o site, dispara no servidor uma coleta + geração de matéria SE a
// última estiver velha (ver refreshNewsIfStale em api/functions/[name].js).
// Throttle próprio (10 min por aba) porque gerar artigo é mais pesado que
// atualizar cotação e não precisa ser tão frequente.
let lastNewsTrigger = 0;
const NEWS_BROWSER_THROTTLE_MS = 10 * 60 * 1000;

export function triggerNewsRefresh() {
  const now = Date.now();
  if (now - lastNewsTrigger < NEWS_BROWSER_THROTTLE_MS) return Promise.resolve(null);
  lastNewsTrigger = now;

  return fetch('/api/functions/refreshNewsIfStale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    keepalive: true,
  })
    .then((response) => response.json().catch(() => null))
    .catch(() => {
    // Silencioso: o servidor só gera matéria se houver notícia velha; qualquer
    // falha aqui não afeta a UI, que segue mostrando o conteúdo atual.
      return null;
    });
}
