import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ArticleCard from '../components/news/ArticleCard';
import NewsletterForm from '../components/news/NewsletterForm';
import TickerBar from '../components/news/TickerBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Flame, Clock, Zap, Bot, Building2 } from 'lucide-react';

const categoryLabels = {
  bolsa: 'Bolsa',
  economia: 'Economia',
  criptomoedas: 'Criptomoedas',
  empresas: 'Empresas',
  internacional: 'Internacional',
};

export default function Home() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles-home'],
    queryFn: () => base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 50),
  });

  const featured = articles.filter((a) => a.is_featured);
  const latest = articles.slice(0, 12);
  const trending = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  const byCategory = {};
  articles.forEach((a) => {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    if (byCategory[a.category].length < 4) byCategory[a.category].push(a);
  });

  if (isLoading) {
    return (
      <>
        <TickerBar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TickerBar />
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Featured */}
        {featured.length > 0 && (
          <section className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ArticleCard article={featured[0]} variant="featured" />
              <div className="grid grid-cols-1 gap-4">
                {featured.slice(1, 3).map((a) => (
                  <ArticleCard key={a.id} article={a} variant="default" />
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Últimas Notícias */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold font-display">Últimas Notícias</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latest.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>

            {/* Category sections */}
            {Object.entries(byCategory).filter(([cat]) => ['bolsa', 'economia', 'criptomoedas', 'empresas', 'internacional'].includes(cat)).map(([cat, arts]) => (
              <section key={cat}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold font-display">{categoryLabels[cat] || cat}</h2>
                  <Link to={`/categoria/${cat}`} className="text-xs text-primary hover:underline font-medium">
                    Ver todas →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {arts.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Trending */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-accent" />
                <h3 className="font-bold">Mais Lidas</h3>
              </div>
              <div className="space-y-0">
                {trending.map((a, i) => (
                  <div key={a.id} className="flex gap-3 items-start">
                    <span className="text-2xl font-bold text-muted-foreground/30 leading-none mt-1 font-display">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <ArticleCard article={a} variant="compact" />
                  </div>
                ))}
              </div>
            </div>

            {/* FinanceChat promo */}
            <Link to="/chat" className="group block bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">FinanceChat</h3>
                  <span className="text-[10px] text-chart-2 font-medium">IA ao vivo</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pergunte à IA sobre qualquer ativo, empresa ou notícia do mercado financeiro.
              </p>
              <span className="text-xs text-primary font-medium mt-2 block group-hover:underline">Acessar chat →</span>
            </Link>

            {/* Asset pages promo */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Páginas de Ativos</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['petrobras','vale','itau','nubank','selic','dolar','bitcoin'].map(s => (
                  <Link key={s} to={`/ativo/${s}`} className="text-[11px] px-2 py-1 bg-muted hover:bg-primary/10 hover:text-primary rounded-md transition-colors capitalize font-medium">
                    {s}
                  </Link>
                ))}
                <Link to="/ativos" className="text-[11px] px-2 py-1 text-primary hover:underline font-medium">ver todos →</Link>
              </div>
            </div>

            <NewsletterForm />

            {/* Urgentes */}
            {articles.filter((a) => a.relevance === 'urgente').length > 0 && (
              <div className="bg-destructive/5 rounded-xl border border-destructive/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-destructive" />
                  <h3 className="font-bold text-destructive">Alertas</h3>
                </div>
                {articles.filter((a) => a.relevance === 'urgente').slice(0, 3).map((a) => (
                  <ArticleCard key={a.id} article={a} variant="compact" />
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}