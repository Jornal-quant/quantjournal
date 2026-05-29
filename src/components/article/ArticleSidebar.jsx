import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const QUOTES = [
  { label: 'IBOV', value: '128.450', change: '+0.84%', up: true },
  { label: 'USD/BRL', value: 'R$ 5,21', change: '-0.32%', up: false },
  { label: 'BTC', value: 'US$ 67.400', change: '+2.15%', up: true },
  { label: 'SELIC', value: '10,50%', change: 'a.a.', up: null },
  { label: 'Ouro', value: 'US$ 2.340', change: '+0.55%', up: true },
];

export default function ArticleSidebar({ related = [] }) {
  return (
    <aside className="space-y-6">
      {/* Live Quotes */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-chart-2 rounded-full animate-pulse inline-block" />
          Cotações
        </h3>
        <div className="space-y-2">
          {QUOTES.map((q) => (
            <div key={q.label} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
              <span className="font-semibold text-xs text-muted-foreground w-16">{q.label}</span>
              <span className="font-mono font-medium text-xs">{q.value}</span>
              <span className={`text-xs font-medium flex items-center gap-0.5 ${
                q.up === true ? 'text-chart-2' : q.up === false ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {q.up === true && <TrendingUp className="w-3 h-3" />}
                {q.up === false && <TrendingDown className="w-3 h-3" />}
                {q.up === null && <Minus className="w-3 h-3" />}
                {q.change}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-2">*Dados ilustrativos. Em breve: cotações em tempo real.</p>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold mb-3">Notícias Relacionadas</h3>
          <div className="space-y-3">
            {related.slice(0, 3).map((a) => (
              <Link key={a.id} to={`/artigo/${a.id}`} className="group flex gap-3 hover:bg-muted/30 rounded-lg p-1.5 -mx-1.5 transition-colors">
                {a.image_url && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={a.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {a.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {a.created_date
                      ? formatDistanceToNow(new Date(a.created_date), { addSuffix: true, locale: ptBR })
                      : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}