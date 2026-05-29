import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryLabels = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Dólar',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

const categoryStyles = {
  bolsa: 'bg-blue-600', economia: 'bg-emerald-700', dolar: 'bg-amber-600',
  juros: 'bg-violet-700', criptomoedas: 'bg-orange-600', commodities: 'bg-red-700',
  empresas: 'bg-blue-700', internacional: 'bg-slate-600', renda_fixa: 'bg-teal-700',
};

// SVG placeholders por categoria
const CATEGORY_BG = {
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

const CATEGORY_PATTERN = {
  bolsa: '📈',
  economia: '🏛️',
  dolar: '💱',
  juros: '🏦',
  criptomoedas: '₿',
  commodities: '⚡',
  empresas: '🏢',
  internacional: '🌐',
  renda_fixa: '📊',
};

const relevanceLabel = { urgente: '🚨 Urgente', alta: '⚡ Alta relevância', media: '', baixa: '' };
const relevanceBadge = { urgente: 'bg-red-600 text-white animate-pulse', alta: 'bg-amber-500/90 text-white', media: '', baixa: '' };

function CategoryPlaceholder({ category, className = '' }) {
  const bg = CATEGORY_BG[category] || 'from-slate-900 to-slate-800';
  const icon = CATEGORY_PATTERN[category] || '📰';
  return (
    <div className={`w-full h-full bg-gradient-to-br ${bg} flex flex-col items-center justify-center gap-3 ${className}`}>
      <span className="text-6xl opacity-20 select-none">{icon}</span>
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-0.5 rounded-full bg-white/10"
            style={{ height: `${20 + Math.sin(i * 1.2) * 14}px` }} />
        ))}
      </div>
    </div>
  );
}

function HeroMainCard({ article }) {
  const timeAgo = article.created_date
    ? formatDistanceToNow(new Date(article.created_date), { addSuffix: true, locale: ptBR })
    : '';
  const catBg = categoryStyles[article.category] || 'bg-slate-600';
  const catLabel = categoryLabels[article.category] || article.category;
  const relBadge = relevanceBadge[article.relevance];
  const relLabel = relevanceLabel[article.relevance];

  return (
    <Link to={`/artigo/${article.id}`} className="group block h-full">
      <div className="relative rounded-xl overflow-hidden h-full min-h-[380px] flex flex-col">
        {/* Image or placeholder — full coverage */}
        <div className="absolute inset-0">
          {article.image_url ? (
            <img src={article.image_url} alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <CategoryPlaceholder category={article.category} />
          )}
          {/* Gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Content — bottom overlay */}
        <div className="relative z-10 mt-auto p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${catBg} text-white`}>
              {catLabel}
            </span>
            {relBadge && relLabel && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${relBadge}`}>
                {relLabel}
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight mb-2 font-display
            group-hover:text-white/90 transition-colors line-clamp-3">
            {article.title}
          </h2>
          {article.summary && (
            <p className="text-sm text-white/70 leading-relaxed line-clamp-2 mb-4">
              {article.summary}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-white/50">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>
              {article.source && <span>• {article.source}</span>}
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-white/80
              group-hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full">
              Ler análise <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function HeroSecondaryCard({ article }) {
  const timeAgo = article.created_date
    ? formatDistanceToNow(new Date(article.created_date), { addSuffix: true, locale: ptBR })
    : '';
  const catLabel = categoryLabels[article.category] || article.category;
  const catStyle = categoryStyles[article.category] || 'bg-slate-600';

  return (
    <Link to={`/artigo/${article.id}`} className="group flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50 hover:border-border">
      {/* Thumbnail or mini placeholder */}
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {article.image_url ? (
          <img src={article.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_BG[article.category] || 'from-slate-900 to-slate-800'} flex items-center justify-center`}>
            <span className="text-2xl opacity-40">{CATEGORY_PATTERN[article.category] || '📰'}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className={`text-[9px] font-bold uppercase tracking-wider text-white px-1.5 py-0.5 rounded inline-block mb-1 w-fit ${catStyle}`}>{catLabel}</span>
        <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{article.title}</p>
        <span className="text-[11px] text-muted-foreground mt-1">{timeAgo}</span>
      </div>
    </Link>
  );
}

export default function HeroSection({ articles = [] }) {
  if (articles.length === 0) return null;

  const hero = articles[0];
  const secondary = articles.slice(1, 4);

  if (secondary.length === 0) {
    // Single article — full width hero
    return (
      <section>
        <HeroMainCard article={hero} />
      </section>
    );
  }

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-stretch">
        <HeroMainCard article={hero} />
        <div className="flex flex-col gap-3">
          {secondary.map((a) => <HeroSecondaryCard key={a.id} article={a} />)}
        </div>
      </div>
    </section>
  );
}