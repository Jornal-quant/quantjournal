import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const FALLBACK = [
  { symbol: 'IBOV', name: 'Ibovespa', price: 137248, change_percent: 0.62, market_type: 'index' },
  { symbol: 'USD/BRL', name: 'Dólar', price: 5.68, change_percent: 0.41, market_type: 'fx' },
  { symbol: 'SELIC', name: 'SELIC', price: 13.25, change_percent: 0, market_type: 'rate' },
  { symbol: 'BTC', name: 'Bitcoin', price: 108200, change_percent: 1.92, market_type: 'crypto' },
  { symbol: 'OIL', name: 'Petróleo', price: 64.8, change_percent: -1.1, market_type: 'commodity' },
  { symbol: 'GOLD', name: 'Ouro', price: 3290, change_percent: 0.52, market_type: 'commodity' },
];

const MARKET_ICONS = {
  index: '📈', fx: '💱', rate: '🏦', crypto: '🪙', commodity: '🛢️',
};

function formatPrice(s) {
  if (!s.price) return '—';
  if (s.market_type === 'rate') return `${s.price.toFixed(2)}%`;
  if (s.market_type === 'fx') return `R$ ${s.price.toFixed(2)}`;
  if (s.market_type === 'index') return s.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  if (s.price > 50000) return `US$ ${(s.price / 1000).toFixed(1)}k`;
  if (s.price > 1000) return `US$ ${s.price.toLocaleString('pt-BR')}`;
  return `US$ ${s.price.toFixed(2)}`;
}

export default function MarketRadar() {
  const { data: snapshots = [] } = useQuery({
    queryKey: ['market-radar'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
    staleTime: 5 * 60 * 1000,
  });

  const data = snapshots.length > 0 ? snapshots : FALLBACK;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-foreground">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-background/80">Radar do Mercado</span>
        </div>
        <span className="text-[10px] text-background/40">
          {snapshots.length > 0 ? 'Dados ao vivo' : 'Dados ilustrativos'}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-border/50">
        {data.slice(0, 6).map((s) => {
          const up = s.change_percent > 0;
          const neutral = s.change_percent === 0;
          return (
            <div key={s.symbol} className="p-3 text-center hover:bg-muted/30 transition-colors">
              <div className="text-base mb-1">{MARKET_ICONS[s.market_type] || '📊'}</div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">{s.name || s.symbol}</p>
              <p className="text-sm font-black font-mono">{formatPrice(s)}</p>
              <p className={`text-xs font-semibold flex items-center justify-center gap-0.5 mt-0.5 ${neutral ? 'text-muted-foreground' : up ? 'text-emerald-600' : 'text-red-500'}`}>
                {neutral ? <Minus className="w-3 h-3" /> : up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {s.change_percent != null ? `${s.change_percent > 0 ? '+' : ''}${s.change_percent.toFixed(2)}%` : '—'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}