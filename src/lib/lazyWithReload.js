import { lazy } from 'react';

// Recarrega a página UMA vez quando um "pedaço" (chunk) do app não é encontrado.
// Isso acontece logo após um novo deploy: o navegador ainda tem o HTML/JS antigo,
// que aponta para arquivos que não existem mais. Ao navegar para uma rota
// carregada sob demanda (ex.: IA Chat, Admin), o import dinâmico falha e o
// usuário via "page not found". Em vez de quebrar a tela, recarregamos para
// pegar a versão nova do site.
//
// A flag em sessionStorage evita loop infinito: se mesmo após recarregar o
// import ainda falhar (erro real, e não deploy), propaga o erro. Em caso de
// sucesso, a flag é limpa para que o próximo deploy também possa recarregar.
const RELOAD_KEY = 'qj_chunk_reloaded';

export function lazyWithReload(factory) {
  return lazy(async () => {
    try {
      const mod = await factory();
      try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* ignore */ }
      return mod;
    } catch (err) {
      let alreadyReloaded = false;
      try { alreadyReloaded = !!sessionStorage.getItem(RELOAD_KEY); } catch { /* ignore */ }
      if (!alreadyReloaded) {
        try { sessionStorage.setItem(RELOAD_KEY, '1'); } catch { /* ignore */ }
        window.location.reload();
        return { default: () => null }; // placeholder enquanto recarrega
      }
      throw err; // já tentamos recarregar; é erro de verdade
    }
  });
}
