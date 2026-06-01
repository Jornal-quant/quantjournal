import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Eye, ExternalLink, ChevronRight, AlertTriangle, TrendingUp, TrendingDown, Minus, Share2 } from 'lucide-react';
import ArticleCard from '../components/news/ArticleCard';
import ArticleSEO from '../components/article/ArticleSEO';
import ArticleSidebar from '../components/article/ArticleSidebar';

const CAT_LABEL = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Câmbio',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g, '$1').replace(/https?:\/\/\S+/g, '').trim();
}

// Quebra o texto em parágrafos legíveis. Usa as quebras de linha quando existem;
// para conteúdo legado sem quebras, agrupa ~3 frases por parágrafo.
function toParagraphs(text) {
  const clean = cleanText(text);
  if (!clean) return [];
  if (/\n/.test(clean)) {
    return clean.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  }
  const sentences = clean.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [clean];
  const paras = [];
  for (let i = 0; i < sentences.length; i += 3) {
    paras.push(sentences.slice(i, i + 3).join(' ').trim());
  }
  return paras.filter(Boolean);
}

function estimateReadingTime(article) {
  const text = [article.what_happened, article.why_it_matters, article.conclusion].filter(Boolean).join(' ');
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

function SentimentBadge({ sentiment }) {
  if (!sentiment) return null;
  const map = {
    positivo: { label: 'Sentimento positivo', cls: 'text-ds-up bg-ds-up-bg border border-ds-up/20', icon: TrendingUp },
    negativo: { label: 'Sentimento negativo', cls: 'text-ds-dn bg-ds-dn-bg border border-ds-dn/20', icon: TrendingDown },
    neutro:   { label: 'Sentimento neutro',   cls: 'text-muted-foreground bg-ds-surface3 border border-ds-border', icon: Minus },
    misto:    { label: 'Sentimento misto',    cls: 'text-amber-700 bg-amber-50 border border-amber-200', icon: Minus },
  };
  const cfg = map[sentiment];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${cfg.cls}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function ImpactBadge({ impact }) {
  if (!impact) return null;
  const map = {
    critico: 'text-ds-dn bg-ds-dn-bg border border-ds-dn/20',
    alto:    'text-amber-700 bg-amber-50 border border-amber-200',
    medio:   'text-foreground bg-ds-surface3 border border-ds-border',
    baixo:   'text-muted-foreground bg-ds-surface3 border border-ds-border',
  };
  return (
    <span className={`font-mono text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${map[impact] || ''}`}>
      Impacto {impact}
    </span>
  );
}

function ArticleBodySection({ title, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-0.5 h-4 bg-foreground/15 rounded-full flex-shrink-0" />
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Disclaimer() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 bg-ds-surface2 border border-ds-border rounded font-sans text-[11px] text-muted-foreground leading-relaxed">
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-muted-foreground/50" />
      <span>Conteúdo gerado por inteligência artificial com base em fontes públicas. As informações são de caráter informativo e educacional. <strong className="text-foreground/60">Não constitui recomendação de investimento.</strong> Verifique as fontes antes de tomar qualquer decisão financeira.</span>
    </div>
  );
}

export default function ArticlePage() {
  const { id } = useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      // O parâmetro pode ser o slug (URLs novas) ou o id (links antigos).
      let arr = await base44.entities.Article.filter({ slug: id });
      if (!arr || arr.length === 0) arr = await base44.entities.Article.filter({ id });
      return arr[0];
    },
  });

  const { data: related = [] } = useQuery({
    queryKey: ['related', article?.category],
    queryFn: () => base44.entities.Article.filter({ category: article.category, status: 'publicado' }, '-created_date', 6),
    enabled: !!article?.category,
  });

  const { data: moreArticles = [] } = useQuery({
    queryKey: ['more-articles'],
    queryFn: () => base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 8),
    enabled: !!article,
  });

  useEffect(() => {
    if (!article?.id) return;
    // Conta uma leitura por sessão/artigo — evita dupla contagem do StrictMode
    // e inflar a cada refresh. (Idealmente migrar para uma function no backend.)
    const key = `viewed:${article.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    base44.entities.Article.update(article.id, { views: (article.views || 0) + 1 }).catch(() => {});
  }, [article?.id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-10">
          <div className="space-y-4">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="aspect-video rounded-lg" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="font-mono text-sm text-muted-foreground mb-4">Artigo não encontrado.</p>
        <Link to="/" className="font-mono text-sm font-semibold text-foreground hover:opacity-70 transition-opacity">← Voltar à Home</Link>
      </div>
    );
  }

  const pubDate = article.created_date ? format(new Date(article.created_date), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR }) : '';
  const updDate = article.updated_date ? format(new Date(article.updated_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : null;
  const readTime = estimateReadingTime(article);
  const cat = CAT_LABEL[article.category] || article.category;

  let sourceLinks = [];
  if (article.source_links) { try { sourceLinks = JSON.parse(article.source_links); } catch {} }

  const tickers = article.tickers ? article.tickers.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const companies = article.affected_companies ? article.affected_companies.split(',').map((c) => c.trim()).filter(Boolean) : [];
  const keyTakeaways = article.key_takeaways ? article.key_takeaways.split('|').map((k) => k.trim()).filter(Boolean) : [];
  const assetsToWatch = article.assets_to_watch ? article.assets_to_watch.split(',').map((a) => a.trim()).filter(Boolean) : tickers.slice(0, 5);
  const tags = article.tags ? article.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const relatedFiltered = related.filter((r) => r.id !== article.id);
  const suggestedArticles = moreArticles.filter((a) => a.id !== article.id).slice(0, 4);

  return (
    <>
      <ArticleSEO article={article} />

      <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/categoria/${article.category}`} className="hover:text-foreground transition-colors">{cat}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-muted-foreground/50 line-clamp-1 max-w-xs">{article.title?.slice(0, 50)}…</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-10">
          <main className="min-w-0">
            <article>
              {/* Category + badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-widest bg-foreground text-background px-2.5 py-1.5 rounded-sm">{cat}</span>
                {article.relevance === 'urgente' && <span className="font-mono text-[9px] font-semibold uppercase tracking-wider bg-ds-dn text-white px-2 py-1 rounded-sm animate-pulse">🚨 Urgente</span>}
                {article.relevance === 'alta' && <span className="font-mono text-[9px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-200 px-2 py-1 rounded-sm">Alta relevância</span>}
                {article.is_breaking && <span className="font-mono text-[9px] font-semibold uppercase tracking-wider bg-ds-dn text-white px-2 py-1 rounded-sm">Breaking</span>}
                <SentimentBadge sentiment={article.sentiment} />
                <ImpactBadge impact={article.impact_level} />
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl md:text-[2rem] font-semibold leading-tight mb-4 tracking-tight">
                {article.title}
              </h1>

              {/* Summary lede */}
              {article.summary && (
                <p className="font-sans text-lg text-muted-foreground leading-relaxed mb-5 border-l-2 border-ds-border pl-4">
                  {cleanText(article.summary)}
                </p>
              )}

              {/* Meta bar */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[10px] text-muted-foreground mb-4 pb-4 border-b border-ds-border">
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{pubDate}</span>
                {updDate && <span className="flex items-center gap-1.5 text-ds-up"><RefreshCwIcon /> Atualizado {updDate}</span>}
                {article.views > 0 && (
                  <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" />{article.views.toLocaleString('pt-BR')} {article.views === 1 ? 'leitura' : 'leituras'}</span>
                )}
                <span>{readTime} min de leitura</span>
              </div>

              <Disclaimer />

              {/* Hero image */}
              {article.image_url && (
                <div className="rounded-lg overflow-hidden my-6 bg-ds-surface3">
                  <img src={article.image_url} alt={article.title} className="w-full object-cover max-h-[460px]" />
                </div>
              )}

              {/* Key takeaways — Resumo rápido */}
              {keyTakeaways.length > 0 && (
                <div className="bg-ds-surface2 border border-ds-border rounded-lg p-4 mb-8">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Resumo rápido</p>
                  <ul className="space-y-2.5">
                    {keyTakeaways.map((k, i) => (
                      <li key={i} className="flex items-start gap-3 font-sans text-sm text-foreground/90 leading-relaxed">
                        <span className="font-mono text-[10px] font-semibold text-muted-foreground/40 w-4 flex-shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Body */}
              <div className="space-y-10">
                {article.what_happened && (
                  <ArticleBodySection title="O que aconteceu">
                    <div className="font-sans text-[15px] text-foreground/90 leading-[1.8] space-y-4">
                      {toParagraphs(article.what_happened).map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                  </ArticleBodySection>
                )}

                {article.why_it_matters && (
                  <ArticleBodySection title="Contexto de mercado">
                    <div className="font-sans text-[15px] text-foreground/90 leading-[1.8] space-y-4">
                      {toParagraphs(article.why_it_matters).map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                  </ArticleBodySection>
                )}

                {/* Ativos impactados */}
                {(companies.length > 0 || tickers.length > 0) && (
                  <ArticleBodySection title="Ativos impactados">
                    <div className="flex flex-wrap gap-2">
                      {tickers.map((t, i) => (
                        <div key={t} className="flex items-center gap-1.5 bg-ds-surface2 border border-ds-border rounded px-3 py-2">
                          <span className="font-mono text-xs font-semibold">{t}</span>
                          {companies[i] && <span className="font-sans text-xs text-muted-foreground">· {companies[i]}</span>}
                        </div>
                      ))}
                      {companies.length > tickers.length && companies.slice(tickers.length).map((c) => (
                        <div key={c} className="bg-ds-surface2 border border-ds-border rounded px-3 py-2">
                          <span className="font-sans text-xs text-foreground/90">{c}</span>
                        </div>
                      ))}
                    </div>
                  </ArticleBodySection>
                )}

                {article.conclusion && (
                  <ArticleBodySection title="Possível impacto">
                    <div className="bg-ds-surface2 border-l-2 border-foreground/20 pl-4 py-1">
                      <div className="font-sans text-[15px] text-foreground/90 leading-[1.8] space-y-4">
                        {toParagraphs(article.conclusion).map((p, i) => <p key={i}>{p}</p>)}
                      </div>
                    </div>
                  </ArticleBodySection>
                )}

                {/* Ativos a monitorar */}
                {assetsToWatch.length > 0 && (
                  <ArticleBodySection title="Ativos a monitorar">
                    <div className="flex flex-wrap gap-2">
                      {assetsToWatch.map((a) => (
                        <span key={a} className="font-mono text-xs font-semibold px-3 py-1.5 bg-foreground/5 border border-ds-border rounded">{a}</span>
                      ))}
                    </div>
                  </ArticleBodySection>
                )}

                {/* Fontes */}
                {(sourceLinks.length > 0 || article.source) && (
                  <section className="border-t border-ds-border pt-6">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Fontes consultadas</p>
                    <ul className="space-y-2">
                      {sourceLinks.length > 0 ? sourceLinks.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 font-sans text-sm">
                          <span className="w-1 h-1 bg-ds-border rounded-full" />
                          {s.url ? (
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-foreground/85 hover:text-foreground flex items-center gap-1 transition-colors">
                              {s.name} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span className="text-muted-foreground">{s.name}</span>}
                        </li>
                      )) : article.source && (
                        <li className="flex items-center gap-2 font-sans text-sm">
                          <span className="w-1 h-1 bg-ds-border rounded-full" />
                          {article.source_url
                            ? <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-foreground/85 hover:text-foreground flex items-center gap-1">{article.source} <ExternalLink className="w-3 h-3" /></a>
                            : <span className="text-muted-foreground">{article.source}</span>}
                        </li>
                      )}
                    </ul>
                  </section>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {tags.map((tag) => (
                      <Link key={tag} to={`/busca?q=${encodeURIComponent(tag)}`}
                        className="font-mono text-[10px] text-muted-foreground border border-ds-border px-2.5 py-1 rounded hover:bg-ds-surface2 transition-colors">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Share */}
                <div className="flex items-center gap-3 pt-4 border-t border-ds-border">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Compartilhar</span>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
                    className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors border border-ds-border px-3 py-1.5 rounded hover:bg-ds-surface2">
                    <Share2 className="w-3 h-3" /> Copiar link
                  </button>
                </div>

                {/* Bottom disclaimer */}
                <div className="bg-ds-surface2 border border-ds-border rounded-lg p-4">
                  <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
                    <strong className="font-semibold text-foreground/60">Aviso importante:</strong> O conteúdo do Capital Times é meramente informativo e educacional. Não constitui recomendação de investimento, consultoria financeira, oferta de compra ou venda de ativos, nem garantia de resultados. Sempre consulte fontes oficiais e profissionais qualificados antes de tomar decisões financeiras.
                  </p>
                </div>
              </div>
            </article>

            {/* Leia também */}
            {suggestedArticles.length > 0 && (
              <section className="mt-12 pt-8 border-t border-ds-border">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-5">Leia também</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestedArticles.map((a) => <ArticleCard key={a.id} article={a} />)}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ArticleSidebar related={relatedFiltered} />
          </div>
        </div>
      </div>
    </>
  );
}

// inline mini icon to avoid extra import
function RefreshCwIcon() {
  return (
    <svg className="w-3 h-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}
