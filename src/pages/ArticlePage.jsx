import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock, Eye, ExternalLink, ChevronRight,
  ClipboardList, Newspaper, Lightbulb, BarChart3,
  Building2, Search, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import ArticleCard from '../components/news/ArticleCard';
import ArticleSEO from '../components/article/ArticleSEO';
import ImpactsTable from '../components/article/ImpactsTable';
import ShareButtons from '../components/article/ShareButtons';
import ArticleSidebar from '../components/article/ArticleSidebar';

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
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function SectionHeader({ icon: Icon, title, color = 'text-primary' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
      <h2 className="text-xl font-bold font-display">{title}</h2>
    </div>
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
    queryFn: () => base44.entities.Article.filter({ category: article.category, status: 'publicado' }, '-created_date', 5),
    enabled: !!article?.category,
  });

  const { data: moreArticles = [] } = useQuery({
    queryKey: ['more-articles'],
    queryFn: () => base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 8),
    enabled: !!article,
  });

  // Increment view count
  useEffect(() => {
    if (article?.id) {
      base44.entities.Article.update(article.id, { views: (article.views || 0) + 1 });
    }
  }, [article?.id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="aspect-video rounded-xl" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
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

  const companies = article.affected_companies
    ? article.affected_companies.split(',').map((c) => c.trim()).filter(Boolean)
    : [];
  const tickers = article.tickers
    ? article.tickers.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  const tags = article.tags
    ? article.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const relatedFiltered = related.filter((r) => r.id !== article.id);
  const suggestedArticles = moreArticles.filter((a) => a.id !== article.id).slice(0, 4);

  const canonicalUrl = window.location.href;
  const catColor = categoryColors[article.category] || '';

  return (
    <>
      <ArticleSEO article={article} />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/categoria/${article.category}`} className="hover:text-foreground transition-colors capitalize">
            {categoryLabels[article.category] || article.category}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground/70 line-clamp-1 max-w-xs">{article.title?.slice(0, 50)}...</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          {/* Main Column */}
          <main>
            <article>
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className={`text-[10px] uppercase tracking-wider border ${catColor}`}>
                  {categoryLabels[article.category] || article.category}
                </Badge>
                {article.relevance === 'urgente' && (
                  <Badge className="bg-destructive text-destructive-foreground text-[10px] animate-pulse">
                    🚨 Urgente
                  </Badge>
                )}
                {article.relevance === 'alta' && (
                  <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]">⚡ Alta relevância</Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-3 font-display">
                {article.title}
              </h1>

              {/* Summary */}
              {article.summary && (
                <p className="text-lg text-muted-foreground leading-relaxed mb-4 font-inter">
                  {article.summary}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {fullDate}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {article.views || 0} visualizações
                </span>
                <span className="flex items-center gap-1">
                  <Newspaper className="w-3.5 h-3.5" />
                  {readTime} min de leitura
                </span>
                {article.source && (
                  article.source_url ? (
                    <a
                      href={article.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Fonte: {article.source}
                    </a>
                  ) : (
                    <span>Fonte: {article.source}</span>
                  )
                )}
              </div>

              {/* Hero Image */}
              {article.image_url && (
                <div className="rounded-xl overflow-hidden mb-8">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full object-cover max-h-[480px]"
                  />
                </div>
              )}

              <Separator className="mb-8" />

              {/* Article Sections */}
              <div className="space-y-10">
                {/* 1. Resumo Executivo */}
                {article.summary && (
                  <section>
                    <SectionHeader icon={ClipboardList} title="Resumo Executivo" color="text-primary" />
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-5">
                      <p className="text-foreground/90 leading-relaxed font-serif text-[15px]">{article.summary}</p>
                    </div>
                  </section>
                )}

                {/* 2. O que aconteceu */}
                {article.what_happened && (
                  <section>
                    <SectionHeader icon={Newspaper} title="O que aconteceu" color="text-chart-5" />
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-line font-serif text-[15px]">
                      {article.what_happened}
                    </p>
                  </section>
                )}

                {/* 3. Por que importa */}
                {article.why_it_matters && (
                  <section>
                    <SectionHeader icon={Lightbulb} title="Por que isso importa" color="text-accent" />
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-line font-serif text-[15px]">
                      {article.why_it_matters}
                    </p>
                  </section>
                )}

                {/* 4. Impactos */}
                {impacts && Object.keys(impacts).length > 0 && (
                  <section>
                    <SectionHeader icon={BarChart3} title="Impactos por classe de ativo" color="text-chart-2" />
                    <ImpactsTable impacts={impacts} />
                  </section>
                )}

                {/* 5. Empresas afetadas */}
                {companies.length > 0 && (
                  <section>
                    <SectionHeader icon={Building2} title="Empresas afetadas" color="text-primary" />
                    <div className="flex flex-wrap gap-2">
                      {companies.map((c, i) => (
                        <div key={c} className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5">
                          {tickers[i] && (
                            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              {tickers[i]}
                            </span>
                          )}
                          <span className="text-sm font-medium">{c}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 6. O que observar */}
                {article.what_happened && (
                  <section>
                    <SectionHeader icon={Search} title="O que observar" color="text-chart-4" />
                    <ul className="space-y-2">
                      {[
                        'Próximas divulgações de dados econômicos relevantes',
                        'Comunicados do Banco Central e decisões de política monetária',
                        'Resultados trimestrais das empresas afetadas',
                        'Movimentações do câmbio USD/BRL',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-foreground/80">
                          <span className="w-1.5 h-1.5 bg-chart-4 rounded-full mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* 7. Conclusão */}
                {article.conclusion && (
                  <section>
                    <SectionHeader icon={CheckCircle} title="Conclusão" color="text-chart-2" />
                    <div className="bg-muted/50 border border-border rounded-xl p-5">
                      <p className="text-foreground/80 leading-relaxed whitespace-pre-line font-serif text-[15px]">
                        {article.conclusion}
                      </p>
                    </div>
                  </section>
                )}
              </div>

              <Separator className="my-8" />

              {/* Share */}
              <ShareButtons title={article.title} url={canonicalUrl} />

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {tags.map((tag) => (
                    <Link key={tag} to={`/busca?q=${encodeURIComponent(tag)}`}>
                      <Badge variant="outline" className="text-xs hover:bg-muted cursor-pointer transition-colors">
                        #{tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </article>

            {/* You might also like */}
            {suggestedArticles.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-bold mb-5 font-display">Você também pode gostar</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestedArticles.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar — desktop only, mobile after article */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ArticleSidebar related={relatedFiltered} />
          </div>
        </div>
      </div>
    </>
  );
}