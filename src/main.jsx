import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Após um deploy novo, o navegador pode ter o HTML antigo apontando para chunks
// que não existem mais. O Vite emite 'vite:preloadError' quando um módulo
// pré-carregado falha; recarregamos uma vez para pegar a versão atual (a flag
// evita loop caso o erro seja real). Complementa o lazyWithReload das rotas.
window.addEventListener('vite:preloadError', () => {
  try {
    if (!sessionStorage.getItem('qj_chunk_reloaded')) {
      sessionStorage.setItem('qj_chunk_reloaded', '1')
      window.location.reload()
    }
  } catch {
    window.location.reload()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
