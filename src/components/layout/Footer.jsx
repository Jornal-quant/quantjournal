import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Shield } from 'lucide-react';

const LINKS = [
  { label: 'Mercados',  items: [['Bolsa', '/categoria/bolsa'], ['Câmbio', '/categoria/dolar'], ['Juros', '/categoria/juros'], ['Cripto', '/categoria/criptomoedas'], ['Commodities', '/categoria/commodities']] },
  { label: 'Análises',  items: [['Economia', '/categoria/economia'], ['Empresas', '/categoria/empresas'], ['Internacional', '/categoria/internacional'], ['Renda Fixa', '/categoria/renda_fixa'], ['Ativos', '/ativos']] },
  { label: 'Ferramentas', items: [['IA Chat', '/chat'], ['Busca', '/busca'], ['Metodologia', '/metodologia'], ['Admin', '/admin']] },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A0A08] border-t border-white/6 mt-20">
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4 group w-fit">
              <div className="w-6 h-6 bg-white/8 rounded flex items-center justify-center group-hover:bg-white/12 transition-colors duration-150">
                <BarChart3 className="w-3.5 h-3.5 text-white/50" />
              </div>
              <span className="font-mono text-[15px] font-semibold tracking-tight text-white">
                Capital <span className="text-[#8C8478]">Times</span>
              </span>
            </Link>
            <p className="font-sans text-[13px] text-white/55 leading-relaxed mb-4">
              Inteligência financeira automatizada — notícias curadas e analisadas por IA, 24h por dia.
            </p>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Atualizado continuamente
            </div>
          </div>

          {LINKS.map((col) => (
            <div key={col.label}>
              <h4 className="font-mono text-[9px] font-semibold uppercase tracking-widest text-white/20 mb-4">{col.label}</h4>
              <div className="space-y-2.5">
                {col.items.map(([l, p]) => (
                  <Link key={p} to={p} className="block font-sans text-[13px] text-white/60 hover:text-white/65 transition-colors duration-150">{l}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="border-t border-white/6 pt-6 space-y-4">
          <div className="flex items-start gap-2.5 bg-white/3 border border-white/6 rounded-lg p-3">
            <Shield className="w-3.5 h-3.5 text-white/20 flex-shrink-0 mt-0.5" />
            <p className="font-sans text-[11px] text-white/50 leading-relaxed">
              O conteúdo do Capital Times é meramente informativo e educacional. Não constitui recomendação de investimento, consultoria financeira, oferta de compra ou venda de ativos, nem garantia de resultados. Sempre consulte fontes oficiais e profissionais qualificados antes de tomar decisões financeiras.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-mono text-[10px] text-white/15">© {new Date().getFullYear()} Capital Times</p>
            <div className="flex items-center gap-4">
              <Link to="/metodologia" className="font-mono text-[10px] text-white/20 hover:text-white/65 transition-colors duration-150">Metodologia</Link>
              <span className="text-white/10">·</span>
              <span className="font-mono text-[10px] text-white/15">Dados com possível atraso</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}