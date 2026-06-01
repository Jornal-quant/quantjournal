import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

const CAT_LABEL = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Câmbio',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

const IMPACT_CONFIG = {
  critico: { label: 'Crítico', bg: 'bg-red-500/15 text-red-400 border-red-500/20' },
  alto:    { label: 'Alto',    bg: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  medio:   { label: 'Médio',   bg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  baixo:   { label: 'Baixo',   bg: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
};

const SENTIMENT_CONFIG = {
  positivo: { icon: TrendingUp,   color: 'text-emerald-400', label: 'Positivo' },
  negativo: { icon: TrendingDown, color: 'text-red-400',     label: 'Negativo' },
  neutro:   { icon: Minus,        color: 'text-slate-400',   label: 'Neutro' },
  misto:    { icon: Minus,        color: 'text-yellow-400',  label: 'Misto' },
};

const CAT_COLORS = {
  bolsa: '#3B82F6', dolar: '#8B5CF6', juros: '#06B6D4', criptomoedas: '#F59E0B',
  commodities: '#10B981', empresas: '#6366F1', internacional: '#EC4899',
  economia: '#84CC16', renda_fixa: '#14B8A6',
};

function CategoryDot({ category }) {
  return <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[category] || '#6B7280' }} />;
}

// Compact list card variant
function CompactCard({ article }) {
  const cat = CAT_LABEL[article.category] || article.category;
  const ago = timeAgo(article.created_date);
  const sentiment = SENTIMENT_CONFIG[article.sentiment];
  const SentimentIcon = sentiment?.icon;

  return (
    <Link to={`/artigo/${article.slug || article.id}`}
      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-foreground/4 transition-colors duration-150 border border-transparent hover:border-foreground/8 cursor-pointer">
      <CategoryDot category={article.category} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-foreground/55">{cat}</span>
          {article.relevance === 'urgente' && (
            <span className="font-mono text-[8px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-sm">Urgente</span>
          )}
        </div>
        <p className="font-mono text-[13px] font-medium leading-snug text-foreground/80 group-hover:text-foreground transition-colors duration-150 line-clamp-2">{article.title}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {SentimentIcon && <SentimentIcon className={`w-3 h-3 ${sentiment.color}`} />}
          <span className="font-mono text-[10px] text-foreground/50">{ago}</span>
          {article.source && <span className="font-mono text-[10px] text-foreground/15 truncate max-w-[80px]">· {article.source}</span>}
        </div>
      </div>
    </Link>
  );
}

// Full card variant
function DefaultCard({ article }) {
  const cat = CAT_LABEL[article.category] || article.category;
  const ago = timeAgo(article.created_date);
  const impact = IMPACT_CONFIG[article.impact_level];
  const sentiment = SENTIMENT_CONFIG[article.sentiment];
  const SentimentIcon = sentiment?.icon;
  const accent = CAT_COLORS[article.category] || '#6B7280';
  const firstTicker = article.tickers ? article.tickers.split(',')[0].trim() : '';

  return (
    <Link to={`/artigo/${article.slug || article.id}`}
      className="group flex flex-col bg-foreground/3 hover:bg-foreground/6 border border-foreground/8 hover:border-foreground/14 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer h-full">
      {/* Image or generated category cover */}
      <div className="relative h-40 flex-shrink-0 overflow-hidden bg-foreground/4">
        {article.image_url ? (
          <img src={article.image_url} alt={article.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity duration-300" loading="lazy" />
        ) : (
          <div
            className="w-full h-full flex flex-col justify-between p-3.5"
            style={{ background: `radial-gradient(ellipse at 75% 20%, ${accent}30 0%, transparent 65%), linear-gradient(135deg, ${accent}12 0%, transparent 70%)` }}>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: `${accent}` }}>{cat}</span>
            <span className="font-mono text-[26px] font-bold leading-none text-foreground/10 self-end tabular-nums">
              {firstTicker || '⬡'}
            </span>
          </div>
        )}
        {/* Overlays */}
        {article.is_breaking && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white">Urgente</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category + sentiment row */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <CategoryDot category={article.category} />
            <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-foreground/55">{cat}</span>
          </div>
          {SentimentIcon && (
            <span className={`flex items-center gap-0.5 font-mono text-[9px] ${sentiment.color}`}>
              <SentimentIcon className="w-3 h-3" />
            </span>
          )}
          {impact && (
            <span className={`font-mono text-[8px] font-semibold uppercase tracking-wider border px-1.5 py-0.5 rounded-sm ml-auto ${impact.bg}`}>
              {impact.label}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-mono text-[14px] font-semibold leading-snug text-foreground/85 group-hover:text-foreground transition-colors duration-150 line-clamp-2 flex-1 mb-2">
          {article.title}
        </h3>

        {/* Summary */}
        {article.summary && (
          <p className="font-sans text-[12px] text-foreground/60 line-clamp-2 leading-relaxed mb-3">{article.summary}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-foreground/6 mt-auto">
          <span className="font-mono text-[10px] text-foreground/50 tabular-nums">{ago}</span>
          {article.source && (
            <span className="font-mono text-[10px] text-foreground/20 truncate max-w-[100px]">{article.source}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ArticleCard({ article, variant = 'default' }) {
  if (variant === 'compact') return <CompactCard article={article} />;
  return <DefaultCard article={article} />;
}