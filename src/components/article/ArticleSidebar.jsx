import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatMarketPrice, formatChangePercent, isSaneSnapshot, timeAgo } from '@/lib/utils';
import NewsletterForm from '../news/NewsletterForm';

const CAT_LABEL = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Câmbio',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

const ECON_EVENTS = [
  { day: 'Qua', event: 'COPOM — Ata da reunião de política monetária', country: '🇧🇷', impact: 'critico' },
  { day: 'Qui', event: 'CPI EUA — Inflação ao consumidor americano',   country: '🇺🇸', impact: 'critico' },
  { day: 'Sex', event: 'Payroll — Criação de empregos nos EUA',        country: '🇺🇸', impact: 'alto' },
  { day: 'Seg', event: 'IPCA-15 — Prévia da inflação brasileira',      country: '🇧🇷', impact: 'alto' },
];

const FALLBACK_QUOTES = [
  { symbol: 'IBOV',    name: 'Ibovespa', price: 137248, change_percent: 0.62, market_type: 'index' },
  { symbol: 'USD/BRL', name: 'Dólar',    price: 5.68,   change_percent: 0.41, market_type: 'fx' },
  { symbol: 'BTC',     name: 'Bitcoin',  price: 108200, change_percent: 1.92, market_type: 'crypto' },
  { symbol: 'SELIC',   name: 'SELIC',    price: 13.25,  change_percent: 0,    market_type: 'rate' },
  { symbol: 'GOLD',    name: 'Ouro',     price: 3290,   change_percent: 0.52, market_type: 'commodity' },
];

const impactDot = { critico: 'bg-ds-dn', alto: 'bg-amber-500', medio: 'bg-ds-up', baixo: 'bg-ds-border' };

export default function ArticleSidebar({ related = [] }) {
  const { data: snapshots = [] } = useQuery({
    queryKey: ['market-snapshots-sidebar'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
    staleTime: 5 * 60 * 1000,
  });

  const liveQuotes = snapshots
    .filter((s) => ['IBOV', 'USD/BRL', 'BTC', 'SELIC', 'GOLD'].includes(s.symbol))
    .filter(isSaneSnapshot);
  const isLive = liveQuotes.length > 0;
  const quotes = isLive ? liveQuotes : FALLBACK_QUOTES;

  return (
    <aside className="space-y-4">
      {/* Market Now */}
      <div className="border border-ds-border rounded-lg overflow-hidden bg-ds-surface">
        <div className="px-4 py-2.5 border-b border-ds-border bg-foreground flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-ds-up animate-pulse' : 'bg-white/20'}`} />
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/50">Mercado agora</h3>
        </div>
        <div className="divide-y divide-ds-border">
          {quotes.map((q) => {
            const up = q.change_percent > 0;
            const dn = q.change_percent < 0;
            return (
              <div key={q.symbol} className="flex items-center justify-between px-4 py-2.5">
                <span className="font-mono text-xs font-semibold">{q.name || q.symbol}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs">{formatMarketPrice(q)}</span>
                  <span className={`flex items-center gap-0.5 font-mono text-[11px] font-semibold w-14 justify-end ${
                    dn ? 'text-ds-dn' : up ? 'text-ds-up' : 'text-muted-foreground'
                  }`}>
                    {dn ? <TrendingDown className="w-3 h-3" /> : up ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {formatChangePercent(q.change_percent)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-ds-border">
          <p className="font-mono text-[9px] text-muted-foreground/40">
            {isLive ? 'Dados do sistema' : 'Valores ilustrativos · integração com dados reais em breve'}
          </p>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="border border-ds-border rounded-lg overflow-hidden bg-ds-surface">
          <div className="px-4 py-2.5 border-b border-ds-border bg-ds-surface2">
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Leia também</h3>
          </div>
          <div className="divide-y divide-ds-border">
            {related.slice(0, 4).map((a) => (
              <Link key={a.id} to={`/artigo/${a.id}`}
                className="group flex gap-3 px-4 py-3 hover:bg-ds-surface2 transition-colors">
                <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0 bg-ds-surface3">
                  {a.image_url
                    ? <img src={a.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
                        <span className="font-mono text-[8px] text-muted-foreground/30">{CAT_LABEL[a.category]?.slice(0, 3) || '···'}</span>
                      </div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-xs font-semibold leading-snug line-clamp-2 group-hover:text-ds-beige transition-colors">{a.title}</p>
                  <span className="font-mono text-[10px] text-muted-foreground mt-1 block">
                    {timeAgo(a.created_date)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Agenda */}
      <div className="border border-ds-border rounded-lg overflow-hidden bg-ds-surface">
        <div className="px-4 py-2.5 border-b border-ds-border bg-ds-surface2 flex items-center justify-between">
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Agenda econômica</h3>
          <span className="font-mono text-[9px] text-muted-foreground/50">referência</span>
        </div>
        <div className="divide-y divide-ds-border">
          {ECON_EVENTS.map((ev) => (
            <div key={ev.event} className="flex items-center gap-3 px-4 py-2.5">
              <span className="font-mono text-[10px] font-semibold text-muted-foreground w-7 flex-shrink-0">{ev.day}</span>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${impactDot[ev.impact] || 'bg-ds-border'}`} />
              <p className="font-sans text-xs text-foreground/80 flex-1 leading-snug">{ev.event}</p>
              <span className="text-sm flex-shrink-0">{ev.country}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat CTA */}
      <Link to="/chat" className="group block bg-foreground rounded-lg p-4 hover:opacity-95 transition-opacity">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-sm text-white/40">⬡</span>
          <p className="font-mono text-[11px] font-semibold text-white">Pergunte ao Market Chat</p>
        </div>
        <p className="font-sans text-xs text-white/30 leading-relaxed">Tire dúvidas sobre este artigo ou qualquer ativo financeiro.</p>
        <span className="font-mono text-[11px] text-white/30 group-hover:text-white/60 mt-2 block transition-colors">Abrir chat →</span>
      </Link>

      <NewsletterForm />

      {/* Disclaimer */}
      <div className="px-1">
        <p className="font-sans text-[10px] text-muted-foreground/40 leading-relaxed">
          Conteúdo gerado por IA com fins informativos. Não constitui recomendação de investimento. Consulte um profissional qualificado.
        </p>
        <Link to="/metodologia" className="font-mono text-[9px] text-muted-foreground/30 hover:text-muted-foreground transition-colors mt-1 block">
          Ver metodologia editorial →
        </Link>
      </div>
    </aside>
  );
}