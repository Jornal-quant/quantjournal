import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FALLBACK = [
  { name: 'IBOV',   value: '137.248', change: '+0.62%', up: true },
  { name: 'USD/BRL',value: 'R$ 5,68',  change: '+0.41%', up: false },
  { name: 'BTC',    value: 'US$ 108k', change: '+1.92%', up: true },
  { name: 'SELIC',  value: '13,25%',   change: '–',      up: null },
  { name: 'OURO',   value: 'US$ 3.290',change: '+0.52%', up: true },
  { name: 'S&P500', value: '5.912',    change: '+0.31%', up: true },
  { name: 'Petróleo',value: 'US$ 64,8',change: '-1.10%', up: false },
];

function fmt(s) {
  if (!s.price) return '—';
  if (s.market_type === 'rate') return `${s.price.toFixed(2)}%`;
  if (s.market_type === 'fx') return `R$ ${s.price.toFixed(2)}`;
  if (s.market_type === 'index') return s.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  if (s.price > 50000) return `US$ ${(s.price / 1000).toFixed(1)}k`;
  return `US$ ${s.price.toFixed(2)}`;
}

export default function TickerBar() {
  const { data: snaps = [] } = useQuery({
    queryKey: ['ticker-snapshots'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
    staleTime: 5 * 60 * 1000,
  });

  const items = snaps.length > 0
    ? snaps.map((s) => ({
        name: s.symbol,
        value: fmt(s),
        change: s.change_percent != null ? `${s.change_percent > 0 ? '+' : ''}${s.change_percent.toFixed(2)}%` : '—',
        up: s.change_percent > 0 ? true : s.change_percent < 0 ? false : null,
      }))
    : FALLBACK;

  const doubled = [...items, ...items];

  return (
    <div className="bg-foreground overflow-hidden border-b border-white/5">
      <div className="flex animate-ticker">
        {doubled.map((t, i) => (
          <div key={i} className="flex items-center gap-2.5 px-5 py-1.5 border-r border-white/5 whitespace-nowrap flex-shrink-0">
            <span className="font-mono text-[10px] font-semibold text-white/50 tracking-wider uppercase">{t.name}</span>
            <span className="font-mono text-[11px] font-medium text-white">{t.value}</span>
            <span className={`font-mono text-[10px] font-semibold ${
              t.up === true ? 'text-ds-up' : t.up === false ? 'text-ds-dn' : 'text-white/25'
            }`}>{t.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}