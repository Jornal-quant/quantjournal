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
