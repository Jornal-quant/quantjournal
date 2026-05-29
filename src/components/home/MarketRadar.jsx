import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown } from 'lucide-react';

const FALLBACK = [
  { symbol: 'IBOV',    name: 'Ibovespa',     price: 137248, change_percent: 0.62,  market_type: 'index' },
  { symbol: 'USD/BRL', name: 'Dólar',        price: 5.68,   change_percent: 0.41,  market_type: 'fx' },
  { symbol: 'SELIC',   name: 'SELIC a.a.',   price: 13.25,  change_percent: 0,     market_type: 'rate' },
  { symbol: 'BTC',     name: 'Bitcoin',      price: 108200, change_percent: 1.92,  market_type: 'crypto' },
  { symbol: 'OIL',     name: 'Petróleo WTI', price: 64.8,   change_percent: -1.1,  market_type: 'commodity' },
  { symbol: 'GOLD',    name: 'Ouro',         price: 3290,   change_percent: 0.52,  market_type: 'commodity' },
];

function formatPrice(s) {
  if (s.price == null) return '—';
  if (s.market_type === 'rate')   return `${s.price.toFixed(2)}%`;
  if (s.market_type === 'fx')     return `R$ ${s.price.toFixed(2)}`;
  if (s.market_type === 'index')  return s.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  if (s.price > 50000)            return `US$ ${(s.price / 1000).toFixed(1)}k`;
  if (s.price > 1000)             return `US$ ${s.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  return `US$ ${s.price.toFixed(2)}`;
}

export default function MarketRadar() {
  const { data: snapshots = [] } = useQuery({
    queryKey: ['market-radar'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
    staleTime: 5 * 60 * 1000,
  });

  const isLive = snapshots.length > 0;
  const data = isLive ? snapshots.slice(0, 6) : FALLBACK;

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden" style={{ backgroundColor: '#111110' }}>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/6 flex items-center justify-between bg-white/3">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-white/15'}`} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/40">Mercados</span>
        </div>
        <span className="font-mono text-[10px] text-white/20">
          {isLive ? 'Dados ao vivo' : 'Dados ilustrativos'}
        </span>
      </div>

      {/* Asset grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-white/6">
        {data.map((s) => {
          const up = s.change_percent > 0;
          const dn = s.change_percent < 0;
          const Icon = up ? TrendingUp : dn ? TrendingDown : null;
          return (
            <div key={s.symbol} className="px-3.5 py-3 hover:bg-white/4 transition-colors duration-150 group">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-white/30 mb-1.5">{s.symbol}</p>
              <p className="font-mono text-[15px] font-semibold text-white/85 tabular-nums leading-none mb-1">{formatPrice(s)}</p>
              <div className="flex items-center gap-1">
                {Icon && <Icon className={`w-3 h-3 ${up ? 'text-emerald-400' : 'text-red-400'}`} />}
                <p className={`font-mono text-[11px] font-medium tabular-nums ${
                  dn ? 'text-red-400' : up ? 'text-emerald-400' : 'text-white/25'
                }`}>
                  {s.change_percent != null ? `${up ? '+' : ''}${s.change_percent.toFixed(2)}%` : '—'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}