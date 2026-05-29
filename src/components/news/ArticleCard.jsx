import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryLabels = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Dólar',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

const categoryStyles = {
  bolsa: 'text-blue-600 border-blue-200 bg-blue-50',
  economia: 'text-emerald-700 border-emerald-200 bg-emerald-50',
  dolar: 'text-amber-700 border-amber-200 bg-amber-50',
  juros: 'text-violet-700 border-violet-200 bg-violet-50',
  criptomoedas: 'text-orange-600 border-orange-200 bg-orange-50',
  commodities: 'text-red-700 border-red-200 bg-red-50',
  empresas: 'text-blue-700 border-blue-200 bg-blue-50',
  internacional: 'text-slate-600 border-slate-200 bg-slate-50',
  renda_fixa: 'text-teal-700 border-teal-200 bg-teal-50',
};

const sentimentIcon = {
  positivo: <TrendingUp className="w-3 h-3 text-emerald-600" />,
  negativo: <TrendingDown className="w-3 h-3 text-red-500" />,
};

export default function ArticleCard({ article, variant = 'default' }) {
  const timeAgo = article.created_date
    ? formatDistanceToNow(new Date(article.created_date), { addSuffix: true, locale: ptBR })
    : '';
  const catStyle = categoryStyles[article.category] || 'text-muted-foreground border-border bg-muted';
  const catLabel = categoryLabels[article.category] || article.category;

  if (variant === 'featured') {
    return (
      <Link to={`/artigo/${article.id}`} className="group block h-full">
        <div className="relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg h-full flex flex-col">
          {article.image_url ? (
            <div className="aspect-[16/9] overflow-hidden flex-shrink-0">
              <img src={article.image_url} alt={article.title}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700" />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-foreground/5 to-foreground/10 flex items-center justify-center flex-shrink-0">
              <span className="text-5xl opacity-30">📰</span>
            </div>
          )}
          <div className="p-5 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              {article.relevance === 'urgente' && (
                <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">🚨 Urgente</span>
              )}
              <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded ${catStyle}`}>{catLabel}</span>
              {article.sentiment && sentimentIcon[article.sentiment]}
            </div>
            <h2 className="text-xl md:text-2xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors font-display flex-1">
              {article.title}
            </h2>
            {article.summary && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{article.summary}</p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>
              {article.source && <span className="truncate">• {article.source}</span>}
              {article.views > 0 && <span className="flex items-center gap-1 ml-auto"><Eye className="w-3 h-3" />{article.views}</span>}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to={`/artigo/${article.id}`} className="group block">
        <div className="flex gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
          {article.image_url ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              <img src={article.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-muted flex items-center justify-center">
              <span className="text-xl">📰</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-[9px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded ${catStyle}`}>{catLabel}</span>
              {article.relevance === 'urgente' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />}
            </div>
            <p className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{article.title}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">{timeAgo}</span>
          </div>
        </div>
      </Link>
    );
  }

  // Default card
  return (
    <Link to={`/artigo/${article.id}`} className="group block">
      <div className="rounded-xl overflow-hidden bg-card border border-border hover:border-primary/25 transition-all duration-200 hover:shadow-md h-full flex flex-col">
        {article.image_url && (
          <div className="aspect-video overflow-hidden flex-shrink-0">
            <img src={article.image_url} alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded ${catStyle}`}>{catLabel}</span>
            {article.relevance === 'urgente' && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">Urgente</span>}
            {article.sentiment && sentimentIcon[article.sentiment]}
          </div>
          <h3 className="font-bold leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2 text-[15px] flex-1">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{article.summary}</p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-auto pt-2 border-t border-border/50">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{timeAgo}</span>
            {article.source && <span className="truncate">• {article.source}</span>}
            {article.ai_confidence > 0 && (
              <span className="ml-auto text-[10px] font-mono text-muted-foreground/60">{article.ai_confidence}%</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}