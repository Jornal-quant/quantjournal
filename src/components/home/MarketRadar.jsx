import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const FALLBACK = [
  { symbol: 'IBOV', name: 'Ibovespa', price: 137248, change_percent: 0.62, market_type: 'index', updated_at: null },
  { symbol: 'USD/BRL', name: 'Dólar', price: 5.68, change_percent: 0.41, market_type: 'fx', updated_at: null },
  { symbol: 'SELIC', name: 'SELIC a.a.', price: 13.25, change_percent: 0, market_type: 'rate', updated_at: null },
  { symbol: 'BTC', name: 'Bitcoin', price: 108200, change_percent: 1.92, market_type: 'crypto', updated_at: null },
  { symbol: 'OIL', name: 'Petróleo WTI', price: 64.8, change_percent: -1.1, market_type: 'commodity', updated_at: null },
  { symbol: 'GOLD', name: 'Ouro', price: 3290, change_percent: 0.52, market_type: 'commodity', updated_at: null },
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
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-foreground">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
          <span className="text-[11px] font-bold uppercase tracking-widest text-background/80">Mercados</span>
        </div>
        <span className="text-[10px] text-background/40">
          {isLive
            ? lastUpdated ? `Atualizado às ${lastUpdated}` : 'Dados ao vivo'
            : '⚠ Dados simulados — configure MarketSnapshot'}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 divide-border/40" style={{ borderStyle: 'solid' }}>
        {data.map((s, i) => {
          const up = s.change_percent > 0;
          const down = s.change_percent < 0;
          const neutral = !up && !down;
          return (
            <div key={s.symbol}
              className={`px-3 py-3 flex flex-col gap-0.5 hover:bg-muted/30 transition-colors
                ${i < data.length - 1 ? 'border-r border-b sm:border-b-0 border-border/40' : ''}`}>
              <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wide truncate">{s.symbol}</p>
              <p className="text-sm font-black font-mono text-foreground leading-none">{formatPrice(s)}</p>
              <div className={`flex items-center gap-0.5 text-[11px] font-semibold mt-0.5
                ${neutral ? 'text-muted-foreground' : up ? 'text-emerald-600' : 'text-red-500'}`}>
                {neutral ? <Minus className="w-2.5 h-2.5" /> : up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                <span>{s.change_percent != null ? `${up ? '+' : ''}${s.change_percent.toFixed(2)}%` : '—'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}