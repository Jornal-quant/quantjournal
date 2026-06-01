import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

const CAT_LABEL = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Câmbio',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

const CAT_ACCENT = {
  bolsa: '#3B82F6', dolar: '#8B5CF6', juros: '#06B6D4', criptomoedas: '#F59E0B',
  commodities: '#10B981', empresas: '#6366F1', internacional: '#EC4899',
  economia: '#84CC16', renda_fixa: '#14B8A6',
};

function HeroMain({ article }) {
  const cat = CAT_LABEL[article.category] || article.category;
  const ago = timeAgo(article.created_date);
  const accent = CAT_ACCENT[article.category] || '#6B7280';

  return (
    <Link to={`/artigo/${article.slug || article.id}`}
      className="group relative block rounded-xl overflow-hidden border border-foreground/8 hover:border-foreground/14 transition-all duration-200 h-80 lg:h-auto" style={{ backgroundColor: 'hsl(var(--card))' }}>
      {article.image_url ? (
        <img src={article.image_url} alt={article.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-55 transition-opacity duration-300" loading="lazy" />
      ) : (
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 70%, ${accent}18 0%, transparent 70%)` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm text-white"
            style={{ backgroundColor: `${accent}30`, border: `1px solid ${accent}40` }}>{cat}</span>
          {article.is_breaking && (
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider bg-red-500/80 text-white px-2 py-0.5 rounded-sm">Urgente</span>
          )}
          {article.sentiment === 'positivo' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
          {article.sentiment === 'negativo' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
        </div>
        <h2 className="font-mono text-2xl font-semibold text-white leading-snug mb-2 group-hover:text-white/90 transition-colors duration-150">
          {article.title}
        </h2>
        {article.summary && (
          <p className="font-sans text-[14px] text-white/78 leading-relaxed line-clamp-2 mb-3">{article.summary}</p>
        )}
        <span className="font-mono text-[11px] text-white/65 tabular-nums">{ago}</span>
      </div>
    </Link>
  );
}

function HeroSecondary({ article }) {
  const cat = CAT_LABEL[article.category] || article.category;
  const ago = timeAgo(article.created_date);
  const accent = CAT_ACCENT[article.category] || '#6B7280';

  return (
    <Link to={`/artigo/${article.slug || article.id}`}
      className="group flex gap-3 p-3.5 rounded-xl border border-foreground/6 hover:border-foreground/12 hover:bg-foreground/3 transition-all duration-200" style={{ backgroundColor: 'hsl(var(--card))' }}>
      {article.image_url && (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-foreground/6">
          <img src={article.image_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-200" loading="lazy" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--title-accent)]">{cat}</span>
        </div>
        <p className="font-mono text-[15px] font-semibold text-foreground/88 group-hover:text-foreground leading-snug line-clamp-2 transition-colors duration-150">{article.title}</p>
        <span className="font-mono text-[11px] text-foreground/55 mt-1 block tabular-nums">{ago}</span>
      </div>
    </Link>
  );
}

export default function HeroSection({ articles }) {
  if (!articles.length) return null;
  const [main, ...rest] = articles;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-[320px]">
      <HeroMain article={main} />
      {rest.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {rest.slice(0, 3).map((a) => <HeroSecondary key={a.id} article={a} />)}
        </div>
      )}
    </div>
  );
}
