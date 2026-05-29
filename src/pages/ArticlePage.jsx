import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Share2, ArrowLeft, Building2, TrendingUp, AlertTriangle, BookOpen, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import ArticleCard from '../components/news/ArticleCard';

const categoryLabels = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Dólar',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

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
    queryFn: () => base44.entities.Article.filter({ category: article.category, status: 'publicado' }, '-created_date', 4),
    enabled: !!article?.category,
  });

  useEffect(() => {
    if (article) {
      base44.entities.Article.update(article.id, { views: (article.views || 0) + 1 });
    }
  }, [article?.id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="h-40 w-full" />
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

  const timeAgo = article.created_date ? formatDistanceToNow(new Date(article.created_date), { addSuffix: true, locale: ptBR }) : '';
  const fullDate = article.created_date ? format(new Date(article.created_date), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR }) : '';

  let impacts = null;
  if (article.impacts) {
    try { impacts = JSON.parse(article.impacts); } catch { impacts = null; }
  }

  const companies = article.affected_companies ? article.affected_companies.split(',').map(c => c.trim()).filter(Boolean) : [];
  const tickers = article.tickers ? article.tickers.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <article>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            {categoryLabels[article.category] || article.category}
          </Badge>
          {article.relevance === 'urgente' && (
            <Badge className="bg-destructive text-destructive-foreground text-[10px]">Urgente</Badge>
          )}
          {article.source && <span className="text-xs text-muted-foreground">Fonte: {article.source}</span>}
        </div>

        <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-3 font-display">
          {article.title}
        </h1>

        {article.summary && (
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">{article.summary}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{fullDate}</span>
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{article.views || 0} visualizações</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs ml-auto"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
          >
            <Share2 className="w-3.5 h-3.5 mr-1" /> Compartilhar
          </Button>
        </div>

        {article.image_url && (
          <div className="rounded-xl overflow-hidden mb-8">
            <img src={article.image_url} alt={article.title} className="w-full object-cover" />
          </div>
        )}

        <Separator className="mb-8" />

        <div className="prose prose-slate max-w-none space-y-8">
          {article.what_happened && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold m-0 font-display">O que aconteceu</h2>
              </div>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{article.what_happened}</p>
            </section>
          )}

          {article.why_it_matters && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-bold m-0 font-display">Por que isso importa</h2>
              </div>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{article.why_it_matters}</p>
            </section>
          )}

          {impacts && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-chart-2" />
                <h2 className="text-xl font-bold m-0 font-display">Possíveis Impactos</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(impacts).map(([key, val]) => (
                  <div key={key} className="bg-muted/50 rounded-lg p-3 border border-border">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">{key}</span>
                    <p className="text-sm mt-1">{val}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {companies.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold m-0 font-display">Empresas Afetadas</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {companies.map((c) => (
                  <Badge key={c} variant="outline" className="px-3 py-1">{c}</Badge>
                ))}
              </div>
              {tickers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tickers.map((t) => (
                    <Badge key={t} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 font-mono text-xs">{t}</Badge>
                  ))}
                </div>
              )}
            </section>
          )}

          {article.conclusion && (
            <section className="bg-muted/50 rounded-xl p-5 border border-border">
              <h2 className="text-xl font-bold mb-2 font-display">Conclusão</h2>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{article.conclusion}</p>
            </section>
          )}
        </div>
      </article>

      {related.filter(r => r.id !== article.id).length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-4 font-display">Notícias Relacionadas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.filter(r => r.id !== article.id).slice(0, 3).map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}