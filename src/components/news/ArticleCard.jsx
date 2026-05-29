import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CAT_LABEL = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Câmbio',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

const CAT_BG = {
  bolsa: 'from-slate-900 to-slate-800',
  economia: 'from-stone-900 to-stone-800',
  dolar: 'from-stone-800 to-stone-700',
  juros: 'from-zinc-900 to-zinc-800',
  criptomoedas: 'from-neutral-900 to-neutral-800',
  commodities: 'from-stone-900 to-stone-800',
  empresas: 'from-gray-900 to-gray-800',
  internacional: 'from-slate-800 to-slate-700',
  renda_fixa: 'from-zinc-800 to-zinc-700',
};

function Placeholder({ category, large = false }) {
  const bg = CAT_BG[category] || 'from-gray-900 to-gray-800';
  const label = CAT_LABEL[category] || category || '';
  return (
    <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
      <span className={`font-mono font-semibold uppercase tracking-widest text-white/10 ${large ? 'text-xs' : 'text-[9px]'}`}>
        {label}
      </span>
    </div>
  );
}

function timeAgo(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export default function ArticleCard({ article, variant = 'default' }) {
  const cat = CAT_LABEL[article.category] || article.category;
  const ago = timeAgo(article.created_date);
  const isUrgent = article.relevance === 'urgente';

  if (variant === 'compact') {
    return (
      <Link to={`/artigo/${article.id}`} className="group flex gap-3 p-2.5 rounded hover:bg-ds-surface2 transition-colors">
        <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0 bg-ds-surface3">
          {article.image_url
            ? <img src={article.image_url} alt="" className="w-full h-full object-cover" />
            : <Placeholder category={article.category} />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{cat}</span>
          <p className="font-serif text-[13px] font-semibold leading-snug group-hover:text-ds-beige transition-colors line-clamp-2 mt-0.5">{article.title}</p>
          <span className="font-mono text-[10px] text-muted-foreground mt-0.5 block">{ago}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/artigo/${article.id}`} className="group block">
      <div className="rounded-lg overflow-hidden bg-ds-surface border border-ds-border hover:shadow-md hover:-translate-y-px transition-all duration-200 h-full flex flex-col">
        {/* Image */}
        <div className="aspect-video overflow-hidden flex-shrink-0 bg-ds-surface3">
          {article.image_url
            ? <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <Placeholder category={article.category} large />}
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {cat}
            </span>
            {isUrgent && (
              <span className="font-mono text-[9px] bg-ds-dn text-white px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wider">
                Urgente
              </span>
            )}
            {article.sentiment === 'positivo' && <span className="font-mono text-[9px] text-ds-up">↑</span>}
            {article.sentiment === 'negativo' && <span className="font-mono text-[9px] text-ds-dn">↓</span>}
          </div>

          <h3 className="font-serif text-[15px] font-semibold leading-snug text-foreground mb-1.5 flex-1 line-clamp-2 group-hover:text-ds-beige transition-colors">
            {article.title}
          </h3>

          {article.summary && (
            <p className="font-sans text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{article.summary}</p>
          )}

          <div className="flex items-center justify-between pt-2.5 border-t border-ds-border mt-auto">
            <span className="font-mono text-[10px] text-muted-foreground">{ago}</span>
            <div className="flex items-center gap-2">
              {article.source && <span className="font-mono text-[10px] text-muted-foreground/50 truncate max-w-[80px]">{article.source}</span>}
              {article.ai_confidence > 0 && (
                <span className="font-mono text-[9px] text-white/50 bg-foreground/80 px-1.5 py-0.5 rounded-sm">⬡ {article.ai_confidence}%</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}