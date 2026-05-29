import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ExternalLink, Mail, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import NewsletterForm from '../news/NewsletterForm';

const ECON_CALENDAR = [
  { date: 'Qua', event: 'COPOM — Ata da reunião', country: '🇧🇷' },
  { date: 'Qui', event: 'CPI EUA — Inflação ao consumidor', country: '🇺🇸' },
  { date: 'Sex', event: 'Payroll — Empregos nos EUA', country: '🇺🇸' },
  { date: 'Seg', event: 'IPCA-15 — Prévia da inflação BR', country: '🇧🇷' },
];

function formatPrice(item) {
  if (!item?.price) return '—';
  if (item.market_type === 'rate') return `${item.price.toFixed(2)}%`;
  if (item.market_type === 'fx') return `R$ ${item.price.toFixed(2)}`;
  if (item.market_type === 'index') return item.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  if (item.market_type === 'crypto' && item.price > 1000) return `US$ ${item.price.toLocaleString('pt-BR')}`;
  return item.price.toFixed(2);
}

const FALLBACK_QUOTES = [
  { symbol: 'IBOV', name: 'Ibovespa', price: 137248, change_percent: 0.6, market_type: 'index' },
  { symbol: 'USD/BRL', name: 'Dólar', price: 5.68, change_percent: 0.4, market_type: 'fx' },
  { symbol: 'BTC', name: 'Bitcoin', price: 108200, change_percent: 1.9, market_type: 'crypto' },
  { symbol: 'SELIC', name: 'SELIC', price: 13.25, change_percent: 0, market_type: 'rate' },
  { symbol: 'GOLD', name: 'Ouro', price: 3290, change_percent: 0.5, market_type: 'commodity' },
];

export default function ArticleSidebar({ related = [] }) {
  const { data: snapshots = [] } = useQuery({
    queryKey: ['market-snapshots-sidebar'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
    staleTime: 5 * 60 * 1000,
  });

  const quotes = snapshots.length > 0
    ? snapshots.filter((s) => ['IBOV', 'USD/BRL', 'BTC', 'SELIC', 'GOLD'].includes(s.symbol))
    : FALLBACK_QUOTES;

  return (
    <aside className="space-y-5">
      {/* Market Now */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/70">Mercado Agora</h3>
        </div>
        <div className="divide-y divide-border/50">
          {quotes.map((q) => {
            const up = q.change_percent > 0 ? true : q.change_percent < 0 ? false : null;
            return (
              <div key={q.symbol} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs font-bold text-foreground">{q.name || q.symbol}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-medium">{formatPrice(q)}</span>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold w-14 justify-end ${
                    up === true ? 'text-emerald-600' : up === false ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {up === true && <TrendingUp className="w-3 h-3" />}
                    {up === false && <TrendingDown className="w-3 h-3" />}
                    {up === null && <Minus className="w-3 h-3" />}
                    {q.change_percent != null ? `${q.change_percent > 0 ? '+' : ''}${q.change_percent.toFixed(2)}%` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground/50">
            {snapshots.length > 0 ? 'Dados de MarketSnapshot' : 'Dados ilustrativos — atualização automática em breve'}
          </p>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/70">Relacionadas</h3>
          </div>
          <div className="divide-y divide-border/50">
            {related.slice(0, 4).map((a) => (
              <Link key={a.id} to={`/artigo/${a.id}`}
                className="group flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                {a.image_url ? (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img src={a.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg flex-shrink-0 bg-muted/60 flex items-center justify-center">
                    <span className="text-lg">📰</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {a.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {a.created_date ? formatDistanceToNow(new Date(a.created_date), { addSuffix: true, locale: ptBR }) : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Economic Calendar */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/70">Agenda Econômica</h3>
        </div>
        <div className="divide-y divide-border/50">
          {ECON_CALENDAR.map((ev) => (
            <div key={ev.event} className="flex items-start gap-3 px-4 py-2.5">
              <span className="text-[10px] font-bold text-muted-foreground w-8 flex-shrink-0 mt-0.5">{ev.date}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground leading-snug">{ev.event}</p>
              </div>
              <span className="text-sm flex-shrink-0">{ev.country}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground/50">Próximos eventos relevantes</p>
        </div>
      </div>

      {/* Newsletter */}
      <NewsletterForm />
    </aside>
  );
}