import React from 'react';
import { Link } from 'react-router-dom';

const LINKS = [
  { label: 'Mercados',  items: [['Bolsa', '/categoria/bolsa'], ['Câmbio', '/categoria/dolar'], ['Juros', '/categoria/juros'], ['Cripto', '/categoria/criptomoedas'], ['Commodities', '/categoria/commodities']] },
  { label: 'Análises',  items: [['Economia', '/categoria/economia'], ['Empresas', '/categoria/empresas'], ['Internacional', '/categoria/internacional'], ['Renda Fixa', '/categoria/renda_fixa'], ['Ativos', '/ativos']] },
  { label: 'Ferramentas', items: [['⬡ IA Chat', '/chat'], ['Busca de Notícias', '/busca'], ['Painel Admin', '/admin']] },
];

export default function Footer() {
  return (
    <footer className="bg-foreground text-background mt-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <span className="font-mono text-[17px] font-semibold tracking-tight text-white">
              FinAI<span style={{ color: '#8C8478' }}>Pulse</span>
            </span>
            <p className="font-sans text-sm text-white/35 leading-relaxed mt-3 mb-4">
              Notícias financeiras geradas e curadas por inteligência artificial, 24h por dia.
            </p>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/25">
              <span className="w-1.5 h-1.5 bg-ds-up rounded-full animate-pulse" />
              Atualizado continuamente por IA
            </div>
          </div>

          {LINKS.map((col) => (
            <div key={col.label}>
              <h4 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-4">{col.label}</h4>
              <div className="space-y-2.5">
                {col.items.map(([l, p]) => (
                  <Link key={p} to={p} className="block font-sans text-sm text-white/45 hover:text-white/80 transition-colors">{l}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[10px] text-white/20">© {new Date().getFullYear()} FinAI Pulse · IBM Plex · Base44</p>
          <p className="font-mono text-[10px] text-white/20">Não constitui recomendação de investimento.</p>
        </div>
      </div>
    </footer>
  );
}