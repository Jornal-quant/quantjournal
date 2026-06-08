import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatMarketPrice, formatChangePercent, isSaneSnapshot, timeAgo } from '@/lib/utils';
import { triggerQuotesRefresh } from '@/lib/market';

// Placeholder neutro enquanto as cotações reais não chegam. NÃO traz números
// inventados — um jornal não pode exibir cotação falsa, nem por um instante.
// Sem price/change_percent, a formatação cai em "—" automaticamente.
const FALLBACK = [
  { symbol: 'IBOV',    name: 'Ibovespa',     market_type: 'index' },
  { symbol: 'USD/BRL', name: 'Dólar',        market_type: 'fx' },
  { symbol: 'SELIC',   name: 'SELIC a.a.',   market_type: 'rate' },
  { symbol: 'BTC',     name: 'Bitcoin',      market_type: 'crypto' },
  { symbol: 'OIL',     name: 'Petróleo WTI', market_type: 'commodity' },
  { symbol: 'GOLD',    name: 'Ouro',         market_type: 'commodity' },
];

export default function MarketRadar() {
  const { data: snapshots = [] } = useQuery({
    queryKey: ['market-radar'],
    queryFn: () => {
      triggerQuotesRefresh(); // mantém as cotações frescas enquanto há visitantes
      return base44.entities.MarketSnapshot.list();
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // cotações ao vivo
    refetchOnWindowFocus: true,
  });

  const sane = snapshots.filter(isSaneSnapshot);
  const isLive = sane.length > 0;
  const data = isLive ? sane.slice(0, 6) : FALLBACK;

  // timestamp da cotação mais recente, quando disponível
  const lastUpdate = isLive
    ? sane.map((s) => s.updated_at || s.updated_date).filter(Boolean).sort().pop()
    : null;

  return (
    <section className="border border-foreground/15 rounded-md overflow-hidden bg-[hsl(var(--card))]">
      <div className="px-4 py-3 border-b border-foreground/15 flex items-center justify-between bg-secondary/40">
        <div className="flex items-center gap-2.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-foreground/30'}`} />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--title-accent)]">Mercados</span>
        </div>
        <span className="font-mono text-[11px] text-foreground/70 tabular-nums">
          {isLive ? (lastUpdate ? `Atualizado ${timeAgo(lastUpdate)}` : 'Dados do sistema') : 'Aguardando dados'}
        </span>
      </div>

      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-foreground/12">
        {data.map((s) => {
          const up = s.change_percent > 0;
          const dn = s.change_percent < 0;
          const Icon = up ? TrendingUp : dn ? TrendingDown : null;
          return (
            <div key={s.symbol} className="px-4 py-3.5 hover:bg-secondary/45 transition-colors duration-150">
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/75">{s.symbol}</p>
                <p className="font-sans text-[11px] text-foreground/45 truncate">{s.name}</p>
              </div>
              <p className="font-mono text-[16px] sm:text-[18px] font-semibold text-foreground tabular-nums leading-none mb-1.5 truncate">{formatMarketPrice(s)}</p>
              <div className="flex items-center gap-1.5">
                {Icon && <Icon className={`w-3 h-3 ${up ? 'text-emerald-500' : 'text-red-500'}`} />}
                <p className={`font-mono text-[12px] font-medium tabular-nums ${
                  dn ? 'text-red-500' : up ? 'text-emerald-500' : 'text-foreground/65'
                }`}>
                  {formatChangePercent(s.change_percent)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
