import React from 'react';
import { Link } from 'react-router-dom';

const COMPANIES = [
  { name: 'Petrobras',  ticker: 'PETR4',  slug: 'petrobras',  sector: 'Energia' },
  { name: 'Vale',       ticker: 'VALE3',  slug: 'vale',       sector: 'Mineração' },
  { name: 'Itaú',       ticker: 'ITUB4',  slug: 'itau',       sector: 'Bancos' },
  { name: 'Ambev',      ticker: 'ABEV3',  slug: 'ambev',      sector: 'Consumo' },
  { name: 'Bradesco',   ticker: 'BBDC4',  slug: 'bradesco',   sector: 'Bancos' },
  { name: 'WEG',        ticker: 'WEGE3',  slug: 'weg',        sector: 'Indústria' },
];

export default function CompaniesInFocus() {
  return (
    <div className="border border-foreground/8 rounded-xl overflow-hidden" style={{ backgroundColor: 'hsl(var(--card))' }}>
      <div className="px-4 py-2.5 border-b border-foreground/6 bg-foreground/3 flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-foreground/60">Empresas em foco</span>
        <Link to="/ativos" className="font-mono text-[9px] text-foreground/20 hover:text-foreground/50 transition-colors duration-150">ver todas →</Link>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-foreground/5">
        {COMPANIES.map((c) => (
          <Link key={c.slug} to={`/ativo/${c.slug}`}
            className="group flex flex-col px-3 py-2.5 hover:bg-foreground/4 transition-colors duration-150">
            <span className="font-mono text-[11px] font-semibold text-foreground/60 group-hover:text-foreground/90 transition-colors duration-150 tabular-nums">{c.ticker}</span>
            <span className="font-sans text-[11px] text-foreground/50 truncate">{c.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}