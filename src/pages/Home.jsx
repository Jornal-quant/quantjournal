import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Clock, Bot, AlertTriangle, ArrowRight } from 'lucide-react';
import ArticleCard from '../components/news/ArticleCard';
import NewsletterForm from '../components/news/NewsletterForm';
import TickerBar from '../components/news/TickerBar';
import MarketRadar from '../components/home/MarketRadar';
import DailySummaryBar from '../components/home/DailySummaryBar';
import EconomicCalendar from '../components/home/EconomicCalendar';
import CompaniesInFocus from '../components/home/CompaniesInFocus';

const CATEGORY_CONFIG = [
  { key: 'bolsa', label: 'Bolsa de Valores', icon: '📈' },
  { key: 'economia', label: 'Economia', icon: '🏛️' },
  { key: 'internacional', label: 'Internacional', icon: '🌐' },
  { key: 'empresas', label: 'Empresas', icon: '🏢' },
  { key: 'criptomoedas', label: 'Criptomoedas', icon: '🪙' },
  { key: 'commodities', label: 'Commodities', icon: '🛢️' },
  { key: 'juros', label: 'Juros & Renda Fixa', icon: '🏦' },
  { key: 'dolar', label: 'Câmbio', icon: '💵' },
];

function SectionHeader({ icon, label, href }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-0.5 h-4 bg-primary rounded-full" />
        <h2 className="text-xs font-black uppercase tracking-widest text-foreground/50">{icon && <span className="mr-1">{icon}</span>}{label}</h2>
      </div>
      {href && (
        <Link to={href} className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <TickerBar />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles-home'],
    queryFn: () => base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 80),
  });

  if (isLoading) return <LoadingState />;

  // Data slices
  const urgent = articles.filter((a) => a.relevance === 'urgente');
  const featured = articles.filter((a) => a.is_featured || a.relevance === 'urgente' || a.relevance === 'alta');
  const heroArticle = featured[0] || articles[0];
  const secondaryFeatured = (featured.length > 1 ? featured.slice(1, 4) : articles.slice(1, 4));
  const latest = articles.slice(0, 12);
  const trending = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);

  const byCategory = {};
  articles.forEach((a) => {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    if (byCategory[a.category].length < 4) byCategory[a.category].push(a);
  });
  const activeCategories = CATEGORY_CONFIG.filter((c) => byCategory[c.key]?.length >= 2);

  // Placeholders when empty
  const showEmpty = articles.length === 0;

  return (
    <>
      <TickerBar />

      {/* Breaking bar */}
      {urgent.length > 0 && (
        <div className="bg-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-3 overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white text-red-600 px-2 py-0.5 rounded flex-shrink-0">🚨 Urgente</span>
            <div className="flex gap-6 overflow-x-auto scrollbar-none">
              {urgent.map((a) => (
                <Link key={a.id} to={`/artigo/${a.id}`} className="text-xs font-medium whitespace-nowrap hover:underline flex-shrink-0">
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">

        {showEmpty ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📰</div>
            <h2 className="text-xl font-bold mb-2">Nenhum artigo ainda</h2>
            <p className="text-muted-foreground text-sm mb-6">Acesse o painel admin para gerar ou importar conteúdo.</p>
            <Link to="/admin" className="text-primary text-sm font-semibold hover:underline">Ir para o Admin →</Link>
          </div>
        ) : (
          <div className="space-y-10">

            {/* Radar + Resumo IA */}
            <section className="space-y-3">
              <MarketRadar />
              <DailySummaryBar articles={articles} />
            </section>

            {/* Manchete */}
            {heroArticle && (
              <section>
                <SectionHeader label="Manchete do Dia" />
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                  <ArticleCard article={heroArticle} variant="featured" />
                  <div className="space-y-3">
                    {secondaryFeatured.filter((a) => a.id !== heroArticle.id).slice(0, 3).map((a) => (
                      <ArticleCard key={a.id} article={a} variant="compact" />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Main 2-col layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
              <div className="space-y-10 min-w-0">

                {/* Últimas */}
                <section>
                  <SectionHeader icon="🕐" label="Últimas Notícias" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {latest.map((a) => <ArticleCard key={a.id} article={a} />)}
                  </div>
                </section>

                {/* Por categoria */}
                {activeCategories.map(({ key, label, icon }) => (
                  <section key={key}>
                    <SectionHeader icon={icon} label={label} href={`/categoria/${key}`} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {byCategory[key].map((a) => <ArticleCard key={a.id} article={a} />)}
                    </div>
                  </section>
                ))}
              </div>

              {/* Sidebar */}
              <aside className="space-y-4">

                {/* Mais Lidas */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-accent" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60">Mais Lidas</h3>
                  </div>
                  <div className="divide-y divide-border/50">
                    {trending.map((a, i) => (
                      <Link key={a.id} to={`/artigo/${a.id}`}
                        className="group flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                        <span className="text-xl font-black text-muted-foreground/20 font-display leading-none mt-0.5 w-5 flex-shrink-0">{i + 1}</span>
                        <p className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-3">{a.title}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* FinanceChat promo */}
                <Link to="/chat" className="group block bg-gradient-to-br from-foreground to-foreground/90 rounded-xl p-4 hover:opacity-95 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-background">FinanceChat IA</p>
                      <span className="text-[10px] text-emerald-400 font-medium">● ao vivo</span>
                    </div>
                  </div>
                  <p className="text-xs text-background/50 leading-relaxed">Pergunte sobre qualquer ativo, empresa ou notícia do mercado.</p>
                  <span className="text-xs text-primary font-semibold mt-2 block group-hover:underline">Acessar chat →</span>
                </Link>

                {/* Empresas em foco */}
                <CompaniesInFocus />

                {/* Agenda econômica */}
                <EconomicCalendar />

                {/* Newsletter */}
                <NewsletterForm />

                {/* Disclaimer */}
                <div className="flex items-start gap-2 px-3 py-2.5 bg-muted/50 rounded-lg border border-border/50">
                  <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Conteúdo gerado por IA. Não constitui recomendação de investimento. Consulte um assessor financeiro.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </>
  );
}