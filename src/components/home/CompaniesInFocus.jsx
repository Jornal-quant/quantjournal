import React from 'react';
import { Link } from 'react-router-dom';

const COMPANIES = [
  { name: 'Petrobras',       ticker: 'PETR4', slug: 'petrobras', sector: 'Energia' },
  { name: 'Vale',            ticker: 'VALE3', slug: 'vale',       sector: 'Mineração' },
  { name: 'Itaú',            ticker: 'ITUB4', slug: 'itau',       sector: 'Financeiro' },
  { name: 'Nubank',          ticker: 'NU',    slug: 'nubank',     sector: 'Fintech' },
  { name: 'Ambev',           ticker: 'ABEV3', slug: 'ambev',      sector: 'Consumo' },
  { name: 'Bradesco',        ticker: 'BBDC4', slug: 'bradesco',   sector: 'Financeiro' },
  { name: 'WEG',             ticker: 'WEGE3', slug: 'weg',        sector: 'Industrial' },
  { name: 'Magazine Luiza',  ticker: 'MGLU3', slug: 'magalu',     sector: 'Varejo' },
];

export default function CompaniesInFocus() {
  return (
    <div className="border border-ds-border rounded-lg overflow-hidden bg-ds-surface">
      <div className="px-4 py-2.5 border-b border-ds-border bg-ds-surface2 flex items-center justify-between">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Empresas em Foco</h3>
        <Link to="/ativos" className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">ver todos →</Link>
      </div>
      <div className="p-2 grid grid-cols-2 gap-px">
        {COMPANIES.map((c) => (
          <Link key={c.ticker} to={`/ativo/${c.slug}`}
            className="group flex items-center gap-2.5 px-3 py-2.5 rounded hover:bg-ds-surface2 transition-colors">
            <div className="w-7 h-7 bg-foreground rounded flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-[8px] font-semibold text-white/70 leading-none">{c.ticker.slice(0, 3)}</span>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-semibold leading-none truncate group-hover:text-ds-beige transition-colors">{c.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{c.ticker}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}