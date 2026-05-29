import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FALLBACK = [
  { name: 'IBOV', value: '137.248', change: '+0.6%', up: true },
  { name: 'S&P 500', value: '5.912', change: '+0.3%', up: true },
  { name: 'USD/BRL', value: 'R$ 5,68', change: '+0.4%', up: false },
  { name: 'BTC', value: 'US$ 108.2k', change: '+1.9%', up: true },
  { name: 'Petróleo', value: 'US$ 64,80', change: '-1.1%', up: false },
  { name: 'Ouro', value: 'US$ 3.290', change: '+0.5%', up: true },
  { name: 'SELIC', value: '13,25%', change: '–', up: null },
  { name: 'ETH', value: 'US$ 2.620', change: '+2.3%', up: true },
];

function formatSnapshotValue(s) {
  if (!s.price) return '—';
  if (s.market_type === 'rate') return `${s.price.toFixed(2)}%`;
  if (s.market_type === 'fx') return `R$ ${s.price.toFixed(2)}`;
  if (s.market_type === 'index') return s.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  if (s.price > 50000) return `US$ ${(s.price / 1000).toFixed(1)}k`;
  if (s.price > 1000) return `US$ ${s.price.toLocaleString('pt-BR')}`;
  return s.price.toFixed(2);
}

export default function TickerBar() {
  const { data: snapshots = [] } = useQuery({
    queryKey: ['ticker-snapshots'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
    staleTime: 5 * 60 * 1000,
  });

  const items = snapshots.length > 0
    ? snapshots.map((s) => ({
        name: s.symbol,
        value: formatSnapshotValue(s),
        change: s.change_percent != null ? `${s.change_percent > 0 ? '+' : ''}${s.change_percent.toFixed(2)}%` : '—',
        up: s.change_percent > 0 ? true : s.change_percent < 0 ? false : null,
      }))
    : FALLBACK;

  const doubled = [...items, ...items];

  return (
    <div className="bg-foreground text-background border-b border-border/20 overflow-hidden">
      <div className="flex animate-ticker">
        {doubled.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-1.5 border-r border-background/10 whitespace-nowrap flex-shrink-0">
            <span className="text-[11px] font-bold text-background/80">{t.name}</span>
            <span className="text-[11px] font-mono text-background">{t.value}</span>
            <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${
              t.up === true ? 'text-emerald-400' : t.up === false ? 'text-red-400' : 'text-background/40'
            }`}>
              {t.up === true ? <TrendingUp className="w-2.5 h-2.5" /> : t.up === false ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
              {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}