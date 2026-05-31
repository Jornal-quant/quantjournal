import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatMarketPrice, formatChangePercent, isSaneSnapshot } from '@/lib/utils';

const FALLBACK = [
  { name: 'IBOV',    value: '137.248',   change: '+0,62%', up: true  },
  { name: 'USD/BRL', value: 'R$ 5,68',   change: '+0,41%', up: false },
  { name: 'BTC',     value: 'US$ 108k',  change: '+1,92%', up: true  },
  { name: 'SELIC',   value: '13,25%',    change: '—',      up: null  },
  { name: 'OURO',    value: 'US$ 3.290', change: '+0,52%', up: true  },
  { name: 'S&P500',  value: '5.912',     change: '+0,31%', up: true  },
  { name: 'PETR',    value: 'US$ 64,80', change: '-1,10%', up: false },
  { name: 'EUR/USD', value: '1,0842',    change: '-0,18%', up: false },
];

export default function TickerBar() {
  const { data: snaps = [] } = useQuery({
    queryKey: ['ticker-snapshots'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
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
    <div className="overflow-hidden border-b border-white/5" style={{ backgroundColor: '#080806' }}>
      <div className="flex h-8">
        {/* Fixed label */}
        <div className="flex items-center gap-1.5 px-4 border-r border-white/6 flex-shrink-0 z-10" style={{ backgroundColor: '#080806' }}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-white/12'}`} />
          <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest whitespace-nowrap">
            {isLive ? 'Sistema' : 'Aguardando'}
          </span>
        </div>
        {/* Scrolling items */}
        <div className="flex animate-ticker">
          {doubled.map((t, i) => (
            <div key={i} className="flex items-center gap-2 px-4 border-r border-white/5 whitespace-nowrap flex-shrink-0 h-full">
              <span className="font-mono text-[10px] font-semibold text-white/55 tracking-widest uppercase">{t.name}</span>
              <span className="font-mono text-[11px] font-medium text-white/75 tabular-nums">{t.value}</span>
              <span className={`font-mono text-[10px] font-semibold tabular-nums ${
                t.up === true ? 'text-emerald-400' : t.up === false ? 'text-red-400' : 'text-white/20'
              }`}>{t.change}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
