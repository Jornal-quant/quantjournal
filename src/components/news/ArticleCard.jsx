import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryLabels = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Dólar',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

const categoryBadge = {
  bolsa: 'text-blue-700 bg-blue-50 border-blue-200',
  economia: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  dolar: 'text-amber-700 bg-amber-50 border-amber-200',
  juros: 'text-violet-700 bg-violet-50 border-violet-200',
  criptomoedas: 'text-orange-600 bg-orange-50 border-orange-200',
  commodities: 'text-red-700 bg-red-50 border-red-200',
  empresas: 'text-slate-700 bg-slate-50 border-slate-200',
  internacional: 'text-slate-600 bg-slate-50 border-slate-200',
  renda_fixa: 'text-teal-700 bg-teal-50 border-teal-200',
};

const categoryBg = {
  bolsa: 'from-blue-950 to-blue-900',
  economia: 'from-emerald-950 to-emerald-900',
  dolar: 'from-amber-950 to-amber-900',
  juros: 'from-violet-950 to-violet-900',
  criptomoedas: 'from-orange-950 to-orange-900',
  commodities: 'from-red-950 to-red-900',
  empresas: 'from-slate-900 to-slate-800',
  internacional: 'from-slate-950 to-slate-900',
  renda_fixa: 'from-teal-950 to-teal-900',
};

const categoryIcon = {
  bolsa: '📈', economia: '🏛️', dolar: '💱', juros: '🏦',
  criptomoedas: '₿', commodities: '⚡', empresas: '🏢',
  internacional: '🌐', renda_fixa: '📊',
};

function Placeholder({ category }) {
  const bg = categoryBg[category] || 'from-slate-900 to-slate-800';
  const icon = categoryIcon[category] || '📰';
  return (
    <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
      <span className="text-3xl opacity-20 select-none">{icon}</span>
    </div>
  );
}

export default function ArticleCard({ article, variant = 'default' }) {
  const timeAgo = article.created_date
    ? formatDistanceToNow(new Date(article.created_date), { addSuffix: true, locale: ptBR })
    : '';
  const catLabel = categoryLabels[article.category] || article.category;
  const catCls = categoryBadge[article.category] || 'text-muted-foreground bg-muted border-border';

  if (variant === 'featured') {
    return (
      <Link to={`/artigo/${article.id}`} className="group block h-full">
        <div className="relative rounded-xl overflow-hidden h-full min-h-[340px] flex flex-col border border-border/50">
          <div className="absolute inset-0">
            {article.image_url
              ? <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              : <Placeholder category={article.category} />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          </div>
          <div className="relative z-10 mt-auto p-5">
            <div className="flex gap-2 mb-2.5 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-sm ${catCls}`}>{catLabel}</span>
              {article.relevance === 'urgente' && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-sm font-bold uppercase animate-pulse">Urgente</span>}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight mb-2 font-display line-clamp-3">{article.title}</h2>
            {article.summary && <p className="text-sm text-white/65 line-clamp-2 mb-3 leading-relaxed">{article.summary}</p>}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>
              <span className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors">
                Ler análise →
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to={`/artigo/${article.id}`} className="group flex gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          {article.image_url
            ? <img src={article.image_url} alt="" className="w-full h-full object-cover" />
            : <Placeholder category={article.category} />}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-[9px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded-sm inline-block mb-1 ${catCls}`}>{catLabel}</span>
          <p className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{article.title}</p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">{timeAgo}</span>
        </div>
      </Link>
    );
  }

  // Default
  return (
    <Link to={`/artigo/${article.id}`} className="group block">
      <div className="rounded-xl overflow-hidden bg-card border border-border hover:border-foreground/20 hover:shadow-sm transition-all h-full flex flex-col">
        <div className="aspect-video overflow-hidden flex-shrink-0 bg-muted">
          {article.image_url
            ? <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <Placeholder category={article.category} />}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded-sm ${catCls}`}>{catLabel}</span>
            {article.relevance === 'urgente' && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-sm font-bold">Urgente</span>}
            {article.sentiment === 'positivo' && <TrendingUp className="w-3 h-3 text-emerald-600" />}
            {article.sentiment === 'negativo' && <TrendingDown className="w-3 h-3 text-red-500" />}
          </div>
          <h3 className="font-bold leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2 text-[14px] flex-1">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{article.summary}</p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-auto pt-2 border-t border-border/40">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{timeAgo}</span>
            {article.source && <span className="truncate">· {article.source}</span>}
            {article.ai_confidence > 0 && (
              <span className="ml-auto text-[10px] font-mono tabular-nums opacity-50">{article.ai_confidence}%</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}