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
  bolsa: 'from-slate-950 to-slate-800',
  economia: 'from-stone-950 to-stone-800',
  dolar: 'from-stone-900 to-stone-700',
  juros: 'from-zinc-950 to-zinc-800',
  criptomoedas: 'from-neutral-950 to-neutral-800',
  commodities: 'from-stone-950 to-stone-700',
  empresas: 'from-gray-900 to-gray-700',
  internacional: 'from-slate-900 to-slate-700',
  renda_fixa: 'from-zinc-900 to-zinc-700',
};

function ago(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

function HeroMain({ article }) {
  const bg = CAT_BG[article.category] || 'from-gray-900 to-gray-800';
  const cat = CAT_LABEL[article.category] || article.category;

  return (
    <Link to={`/artigo/${article.id}`} className="group block h-full">
      <div className="relative rounded-lg overflow-hidden h-full min-h-[360px] flex flex-col">
        {/* Background */}
        <div className="absolute inset-0">
          {article.image_url
            ? <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            : <div className={`w-full h-full bg-gradient-to-br ${bg}`} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 mt-auto p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-widest bg-white/10 text-white/80 px-2 py-1 rounded-sm">{cat}</span>
            {article.relevance === 'urgente' && (
              <span className="font-mono text-[9px] font-semibold uppercase tracking-widest bg-ds-dn text-white px-2 py-1 rounded-sm">🚨 Urgente</span>
            )}
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white leading-tight mb-2 line-clamp-3">
            {article.title}
          </h2>
          {article.summary && (
            <p className="font-sans text-sm text-white/55 leading-relaxed line-clamp-2 mb-4">{article.summary}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 font-mono text-[10px] text-white/35">
              <span>{ago(article.created_date)}</span>
              {article.source && <span>· {article.source}</span>}
            </div>
            <span className="font-mono text-[11px] text-white/60 group-hover:text-white transition-colors">
              Ler análise →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function HeroSecondary({ article }) {
  const bg = CAT_BG[article.category] || 'from-gray-900 to-gray-800';
  const cat = CAT_LABEL[article.category] || article.category;

  return (
    <Link to={`/artigo/${article.id}`}
      className="group flex gap-3 p-3 rounded border border-ds-border hover:border-foreground/20 hover:shadow-sm transition-all bg-ds-surface">
      <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-ds-surface3">
        {article.image_url
          ? <img src={article.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
              <span className="font-mono text-[8px] uppercase tracking-widest text-white/15 font-semibold">{cat}</span>
            </div>}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-1">{cat}</span>
        <p className="font-serif text-sm font-semibold leading-snug line-clamp-2 group-hover:text-ds-beige transition-colors">{article.title}</p>
        <span className="font-mono text-[10px] text-muted-foreground mt-1.5">{ago(article.created_date)}</span>
      </div>
    </Link>
  );
}

export default function HeroSection({ articles = [] }) {
  if (articles.length === 0) return null;
  const [hero, ...secondary] = articles;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-stretch">
      <HeroMain article={hero} />
      {secondary.length > 0 && (
        <div className="flex flex-col gap-3">
          {secondary.slice(0, 3).map((a) => <HeroSecondary key={a.id} article={a} />)}
        </div>
      )}
    </div>
  );
}