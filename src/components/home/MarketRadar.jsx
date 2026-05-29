import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

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
  if (s.market_type === 'rate') return `${s.price.toFixed(2)}%`;
  if (s.market_type === 'fx') return `R$ ${s.price.toFixed(2)}`;
  if (s.market_type === 'index') return s.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  if (s.price > 50000) return `US$ ${(s.price / 1000).toFixed(1)}k`;
  if (s.price > 1000) return `US$ ${s.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
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

  const lastUpdated = (() => {
    if (!isLive) return null;
    const ts = snapshots.find((s) => s.updated_at)?.updated_at;
    if (!ts) return null;
    try { return format(new Date(ts), 'HH:mm'); } catch { return null; }
  })();

  return (
    <div className="border border-ds-border rounded-lg overflow-hidden bg-ds-surface">
      {/* Header */}
      <div className="px-4 py-2 bg-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-ds-up animate-pulse' : 'bg-white/20'}`} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/50">Mercados</span>
        </div>
        <span className="font-mono text-[10px] text-white/25">
          {isLive ? (lastUpdated ? `Atualizado às ${lastUpdated}` : 'Dados ao vivo') : 'Dados simulados'}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6">
        {data.map((s, i) => {
          const up = s.change_percent > 0;
          const dn = s.change_percent < 0;
          return (
            <div key={s.symbol}
              className={`px-3 py-3 hover:bg-ds-surface2 transition-colors flex flex-col gap-0.5
                ${i < data.length - 1 ? 'border-r border-b sm:border-b-0 border-ds-border' : ''}`}>
              <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">{s.symbol}</p>
              <p className="font-mono text-sm font-semibold text-foreground leading-none">{formatPrice(s)}</p>
              <p className={`font-mono text-[11px] font-medium mt-0.5 ${
                dn ? 'text-ds-dn' : up ? 'text-ds-up' : 'text-muted-foreground'
              }`}>
                {s.change_percent != null ? `${up ? '+' : ''}${s.change_percent.toFixed(2)}%` : '—'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}