import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatMarketPrice, formatChangePercent, isSaneSnapshot } from '@/lib/utils';
import { triggerQuotesRefresh } from '@/lib/market';

// Placeholder neutro enquanto as cotações reais não chegam. NÃO traz números
// inventados — um jornal não pode exibir cotação falsa, nem por um instante.
const FALLBACK = [
  { name: 'IBOV',    value: '—', change: '—', up: null },
  { name: 'USD/BRL', value: '—', change: '—', up: null },
  { name: 'BTC',     value: '—', change: '—', up: null },
  { name: 'SELIC',   value: '—', change: '—', up: null },
  { name: 'OURO',    value: '—', change: '—', up: null },
  { name: 'S&P500',  value: '—', change: '—', up: null },
  { name: 'PETR',    value: '—', change: '—', up: null },
  { name: 'EUR/USD', value: '—', change: '—', up: null },
];

export default function TickerBar() {
  const { data: snaps = [] } = useQuery({
    queryKey: ['ticker-snapshots'],
    queryFn: () => {
      triggerQuotesRefresh(); // mantém as cotações frescas enquanto há visitantes
      return base44.entities.MarketSnapshot.list();
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // cotações ao vivo
    refetchOnWindowFocus: true,
  });

  const sane = snaps.filter(isSaneSnapshot);
  const isLive = sane.length > 0;

  const items = isLive
    ? sane.map((s) => ({
        name: s.symbol,
        value: formatMarketPrice(s),
        change: formatChangePercent(s.change_percent),
        up: s.change_percent > 0 ? true : s.change_percent < 0 ? false : null,
      }))
    : FALLBACK;

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-b border-foreground/5" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="flex h-9">
        {/* Fixed label */}
        <div className="flex items-center gap-1.5 px-4 border-r border-foreground/6 flex-shrink-0 z-10" style={{ backgroundColor: 'hsl(var(--background))' }}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-foreground/12'}`} />
          <span className="font-mono text-[10px] text-foreground/45 uppercase tracking-widest whitespace-nowrap">
            {isLive ? 'Sistema' : 'Aguardando'}
          </span>
        </div>
        {/* Scrolling items */}
        <div className="flex animate-ticker">
          {doubled.map((t, i) => (
            <div key={i} className="flex items-center gap-2 px-4 border-r border-foreground/5 whitespace-nowrap flex-shrink-0 h-full">
              <span className="font-mono text-[11px] font-semibold text-foreground/70 tracking-widest uppercase">{t.name}</span>
              <span className="font-mono text-[12px] font-medium text-foreground/85 tabular-nums">{t.value}</span>
              <span className={`font-mono text-[11px] font-semibold tabular-nums ${
                t.up === true ? 'text-emerald-500' : t.up === false ? 'text-red-500' : 'text-foreground/45'
              }`}>{t.change}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
