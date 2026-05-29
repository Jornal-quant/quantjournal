import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

const COMPANIES = [
  { name: 'Petrobras', ticker: 'PETR4', slug: 'petrobras', sector: 'Energia', emoji: '🛢️' },
  { name: 'Vale', ticker: 'VALE3', slug: 'vale', sector: 'Mineração', emoji: '⛏️' },
  { name: 'Itaú', ticker: 'ITUB4', slug: 'itau', sector: 'Financeiro', emoji: '🏦' },
  { name: 'Nubank', ticker: 'NU', slug: 'nubank', sector: 'Fintech', emoji: '💜' },
  { name: 'Ambev', ticker: 'ABEV3', slug: 'ambev', sector: 'Consumo', emoji: '🍺' },
  { name: 'Bradesco', ticker: 'BBDC4', slug: 'bradesco', sector: 'Financeiro', emoji: '🏛️' },
  { name: 'WEG', ticker: 'WEGE3', slug: 'weg', sector: 'Industrial', emoji: '⚙️' },
  { name: 'Magazine Luiza', ticker: 'MGLU3', slug: 'magalu', sector: 'Varejo', emoji: '🛍️' },
];

export default function CompaniesInFocus() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60">Empresas em Foco</h3>
        </div>
        <Link to="/ativos" className="text-[11px] text-primary hover:underline font-medium">ver todos →</Link>
      </div>
      <div className="p-3 grid grid-cols-2 gap-1.5">
        {COMPANIES.map((c) => (
          <Link key={c.ticker} to={`/ativo/${c.slug}`}
            className="group flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors">
            <span className="text-base flex-shrink-0">{c.emoji}</span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-none truncate group-hover:text-primary transition-colors">{c.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{c.ticker}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}