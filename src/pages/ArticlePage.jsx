import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Eye, ExternalLink, ChevronRight, Newspaper, Lightbulb, BarChart3, Building2, Search, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import ArticleCard from '../components/news/ArticleCard';
import ArticleSEO from '../components/article/ArticleSEO';
import ImpactsTable from '../components/article/ImpactsTable';
import ShareButtons from '../components/article/ShareButtons';
import ArticleSidebar from '../components/article/ArticleSidebar';
import InvestorSummaryBox from '../components/article/InvestorSummaryBox';

const categoryLabels = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Dólar',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

const categoryColors = {
  bolsa: 'bg-primary/10 text-primary border-primary/20',
  dolar: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  juros: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  criptomoedas: 'bg-accent/10 text-accent border-accent/20',
  commodities: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  economia: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  empresas: 'bg-primary/10 text-primary border-primary/20',
  internacional: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  renda_fixa: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
};

function estimateReadingTime(article) {
  const text = [article.what_happened, article.why_it_matters, article.conclusion].filter(Boolean).join(' ');
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

// Clean raw markdown links from AI text: [text](url) → text
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .trim();
}

function ArticleSection({ icon: Icon, title, color, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-0.5 h-5 rounded-full ${color.replace('text-', 'bg-')}`} />
        <h2 className="text-base font-bold uppercase tracking-wide text-foreground/50 text-xs">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function ArticlePage() {
  const { id } = useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const articles = await base44.entities.Article.filter({ id });
      return articles[0];
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
    if (article?.id) {
      base44.entities.Article.update(article.id, { views: (article.views || 0) + 1 });
    }
  }, [article?.id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
          <div className="space-y-5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="aspect-video rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Artigo não encontrado.</p>
        <Link to="/"><Button>Voltar à Home</Button></Link>
      </div>
    );
  }

  const fullDate = article.created_date
    ? format(new Date(article.created_date), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })
    : '';
  const readTime = estimateReadingTime(article);

  let impacts = null;
  if (article.impacts) {
    try { impacts = JSON.parse(article.impacts); } catch { impacts = null; }
  }

  let sourceLinks = [];
  if (article.source_links) {
    try { sourceLinks = JSON.parse(article.source_links); } catch { sourceLinks = []; }
  }

  const companies = article.affected_companies
    ? article.affected_companies.split(',').map((c) => c.trim()).filter(Boolean)
    : [];
  const tickers = article.tickers
    ? article.tickers.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  const tags = article.tags
    ? article.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  const keyTakeaways = article.key_takeaways
    ? article.key_takeaways.split('|').map((k) => k.trim()).filter(Boolean)
    : [];
  const assetsToWatch = article.assets_to_watch
    ? article.assets_to_watch.split(',').map((a) => a.trim()).filter(Boolean)
    : tickers.slice(0, 5);

  const relatedFiltered = related.filter((r) => r.id !== article.id);
  const suggestedArticles = moreArticles.filter((a) => a.id !== article.id).slice(0, 4);
  const catColor = categoryColors[article.category] || '';
  const canonicalUrl = window.location.href;

  return (
    <>
      <ArticleSEO article={article} />

      <div className="max-w-7xl mx-auto px-4 py-5 md:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/categoria/${article.category}`} className="hover:text-foreground transition-colors capitalize">
            {categoryLabels[article.category] || article.category}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground/50 line-clamp-1 max-w-xs">{article.title?.slice(0, 55)}…</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
          {/* Main */}
          <main className="min-w-0">
            <article>
              {/* Category + Urgency */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge className={`text-[10px] uppercase tracking-widest font-bold border px-2.5 ${catColor}`}>
                  {categoryLabels[article.category] || article.category}
                </Badge>
                {article.relevance === 'urgente' && (
                  <Badge className="bg-red-600 text-white text-[10px] animate-pulse">🚨 Urgente</Badge>
                )}
                {article.relevance === 'alta' && (
                  <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px]">⚡ Alta relevância</Badge>
                )}
                {article.sentiment === 'positivo' && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px]">↑ Positivo</Badge>
                )}
                {article.sentiment === 'negativo' && (
                  <Badge className="bg-red-500/10 text-red-600 border border-red-500/20 text-[10px]">↓ Negativo</Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-[2.15rem] font-bold leading-tight mb-4 font-display tracking-tight">
                {article.title}
              </h1>

              {/* Lede / Summary */}
              {article.summary && (
                <p className="text-lg md:text-xl text-foreground/70 leading-relaxed mb-5 border-l-4 border-primary/30 pl-4 font-inter">
                  {cleanText(article.summary)}
                </p>
              )}

              {/* Meta bar */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground mb-6 pb-6 border-b border-border">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fullDate}</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{article.views || 0} leituras</span>
                <span>{readTime} min de leitura</span>
                {article.source && (
                  article.source_url ? (
                    <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />Fonte: {article.source}
                    </a>
                  ) : <span>Fonte: {article.source}</span>
                )}
              </div>

              {/* Hero Image */}
              {article.image_url && (
                <div className="rounded-2xl overflow-hidden mb-8 bg-muted">
                  <img src={article.image_url} alt={article.title} className="w-full object-cover max-h-[460px]" />
                </div>
              )}

              {/* ⭐ Investor Summary Box */}
              <InvestorSummaryBox article={article} />

              {/* Key Takeaways */}
              {keyTakeaways.length > 0 && (
                <div className="bg-muted/40 border border-border rounded-xl p-4 mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Pontos-chave</p>
                  <ul className="space-y-2">
                    {keyTakeaways.map((k, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                        <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Article Body */}
              <div className="space-y-10 prose-article">
                {/* O que aconteceu */}
                {article.what_happened && (
                  <ArticleSection icon={Newspaper} title="O que aconteceu" color="text-primary">
                    <div className="text-[15px] text-foreground/80 leading-[1.8] space-y-4 font-inter">
                      {cleanText(article.what_happened).split('\n').filter(Boolean).map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </ArticleSection>
                )}

                {/* Por que importa */}
                {article.why_it_matters && (
                  <ArticleSection icon={Lightbulb} title="Por que isso importa" color="text-accent">
                    <div className="text-[15px] text-foreground/80 leading-[1.8] space-y-4 font-inter">
                      {cleanText(article.why_it_matters).split('\n').filter(Boolean).map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </ArticleSection>
                )}

                {/* Impactos */}
                {impacts && Object.keys(impacts).length > 0 && (
                  <ArticleSection icon={BarChart3} title="Impacto por classe de ativo" color="text-chart-2">
                    <ImpactsTable impacts={impacts} />
                  </ArticleSection>
                )}

                {/* Empresas + Tickers */}
                {(companies.length > 0 || tickers.length > 0) && (
                  <ArticleSection icon={Building2} title="Empresas e ativos afetados" color="text-primary">
                    <div className="flex flex-wrap gap-2">
                      {companies.length > 0 ? companies.map((c, i) => (
                        <div key={c} className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5 text-sm">
                          {tickers[i] && (
                            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{tickers[i]}</span>
                          )}
                          <span className="font-medium">{c}</span>
                        </div>
                      )) : tickers.map((t) => (
                        <span key={t} className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20">{t}</span>
                      ))}
                    </div>
                  </ArticleSection>
                )}

                {/* O que observar */}
                {assetsToWatch.length > 0 && (
                  <ArticleSection icon={Search} title="Ativos a monitorar" color="text-chart-4">
                    <div className="flex flex-wrap gap-2">
                      {assetsToWatch.map((a) => (
                        <span key={a} className="px-3 py-1.5 bg-chart-4/10 text-chart-4 border border-chart-4/20 rounded-lg text-xs font-mono font-bold">
                          {a}
                        </span>
                      ))}
                    </div>
                  </ArticleSection>
                )}

                {/* Conclusão */}
                {article.conclusion && (
                  <ArticleSection icon={CheckCircle} title="Perspectiva para o investidor" color="text-chart-2">
                    <div className="bg-foreground/[0.03] border-l-4 border-chart-2/50 pl-5 py-1">
                      <div className="text-[15px] text-foreground/80 leading-[1.8] space-y-4 font-inter">
                        {cleanText(article.conclusion).split('\n').filter(Boolean).map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </div>
                  </ArticleSection>
                )}

                {/* Fontes consultadas */}
                {(sourceLinks.length > 0 || article.source) && (
                  <section className="border-t border-border pt-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Fontes consultadas</p>
                    <ul className="space-y-1.5">
                      {sourceLinks.length > 0 ? sourceLinks.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
                          {s.url ? (
                            <a href={s.url} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1">
                              {s.name} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span className="text-muted-foreground">{s.name}</span>}
                        </li>
                      )) : article.source ? (
                        <li className="flex items-center gap-2 text-sm">
                          <span className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
                          {article.source_url ? (
                            <a href={article.source_url} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1">
                              {article.source} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : <span className="text-muted-foreground">{article.source}</span>}
                        </li>
                      ) : null}
                    </ul>
                  </section>
                )}
              </div>

              <Separator className="my-8" />
              <ShareButtons title={article.title} url={canonicalUrl} />

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {tags.map((tag) => (
                    <Link key={tag} to={`/busca?q=${encodeURIComponent(tag)}`}>
                      <Badge variant="outline" className="text-xs hover:bg-muted cursor-pointer">#{tag}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </article>

            {/* Você também pode gostar */}
            {suggestedArticles.length > 0 && (
              <section className="mt-12 pt-8 border-t border-border">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">Leia também</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestedArticles.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
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