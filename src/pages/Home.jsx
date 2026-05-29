import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Bot, AlertTriangle, ArrowRight } from 'lucide-react';

import ArticleCard from '../components/news/ArticleCard';
import NewsletterForm from '../components/news/NewsletterForm';
import TickerBar from '../components/news/TickerBar';
import MarketRadar from '../components/home/MarketRadar';
import DailySummaryBar from '../components/home/DailySummaryBar';
import EconomicCalendar from '../components/home/EconomicCalendar';
import CompaniesInFocus from '../components/home/CompaniesInFocus';
import HeroSection from '../components/home/HeroSection';

// Dedup articles by id only — remove true duplicates
function dedupe(arr) {
  const seen = new Set();
  return arr.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

const CATEGORY_SECTIONS = [
  { key: 'bolsa', label: 'Bolsa de Valores', icon: '📈' },
  { key: 'economia', label: 'Economia', icon: '🏛️' },
  { key: 'internacional', label: 'Internacional', icon: '🌐' },
  { key: 'empresas', label: 'Empresas', icon: '🏢' },
  { key: 'criptomoedas', label: 'Criptomoedas', icon: '🪙' },
  { key: 'commodities', label: 'Commodities & Energia', icon: '🛢️' },
  { key: 'juros', label: 'Juros & Renda Fixa', icon: '🏦' },
  { key: 'dolar', label: 'Câmbio', icon: '💵' },
];

function SectionHeader({ icon, label, href }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-5 bg-foreground rounded-full" />
        <h2 className="text-xs font-black uppercase tracking-widest text-foreground/50">
          {icon && <span className="mr-1">{icon}</span>}{label}
        </h2>
      </div>
      {href && (
        <Link to={href} className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors font-medium">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <TickerBar />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-[380px] rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="grid grid-cols-2 gap-4">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
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
  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['articles-home'],
    queryFn: () => base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 100),
  });

  // Dedupe — must be before any early return
  const articles = useMemo(() => dedupe(raw), [raw]);

  if (isLoading) return <LoadingSkeleton />;

  // Hero: urgente + featured first, then latest
  const priority = articles.filter((a) => a.is_featured || a.relevance === 'urgente' || a.relevance === 'alta');
  const heroArticles = priority.length >= 1 ? priority.slice(0, 4) : articles.slice(0, 4);
  const heroIds = new Set(heroArticles.map((a) => a.id));

  // Latest excluding hero
  const latest = articles.filter((a) => !heroIds.has(a.id)).slice(0, 10);
  const latestIds = new Set(latest.map((a) => a.id));

  // Trending by views
  const usedInMain = new Set([...heroIds, ...latestIds]);
  const trending = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .filter((a) => !usedInMain.has(a.id) || (a.views || 0) > 0)
    .slice(0, 6);

  // By category — exclude hero articles
  const byCategory = {};
  articles.forEach((a) => {
    if (heroIds.has(a.id)) return; // don't repeat hero in categories
    if (!byCategory[a.category]) byCategory[a.category] = [];
    if (byCategory[a.category].length < 4) byCategory[a.category].push(a);
  });
  const activeCategories = CATEGORY_SECTIONS.filter((c) => (byCategory[c.key]?.length || 0) >= 1);

  const urgent = articles.filter((a) => a.relevance === 'urgente');

  return (
    <>
      <TickerBar />

      {/* Breaking bar */}
      {urgent.length > 0 && (
        <div className="bg-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-3 overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white text-red-600 px-2 py-0.5 rounded flex-shrink-0">
              🚨 Urgente
            </span>
            <div className="flex gap-6 overflow-x-auto scrollbar-none">
              {urgent.map((a) => (
                <Link key={a.id} to={`/artigo/${a.id}`}
                  className="text-xs font-medium whitespace-nowrap hover:underline flex-shrink-0">
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {articles.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <div className="text-5xl">📰</div>
            <h2 className="text-lg font-bold">Nenhum artigo publicado ainda</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Acesse o painel admin para gerar conteúdo com IA ou processar a fila de notícias.
            </p>
            <Link to="/admin" className="inline-block text-sm text-primary font-semibold hover:underline mt-2">
              Ir para o Admin →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Radar + Resumo */}
            <div className="space-y-3">
              <MarketRadar />
              <DailySummaryBar articles={articles} />
            </div>

            {/* Hero / Manchete */}
            <div>
              <SectionHeader label="Manchete do Dia" />
              <HeroSection articles={heroArticles} />
            </div>

            {/* Main feed + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_296px] gap-8">

              {/* Feed */}
              <div className="space-y-10 min-w-0">

                {/* Últimas */}
                {latest.length > 0 && (
                  <section>
                    <SectionHeader icon="🕐" label="Últimas Notícias" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {latest.map((a) => <ArticleCard key={a.id} article={a} />)}
                    </div>
                  </section>
                )}

                {/* Por categoria */}
                {activeCategories.map(({ key, label, icon }) => (
                  <section key={key}>
                    <SectionHeader icon={icon} label={label} href={`/categoria/${key}`} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {byCategory[key].map((a) => <ArticleCard key={a.id} article={a} />)}
                    </div>
                  </section>
                ))}

                {/* Fallback: if no categories have enough content */}
                {activeCategories.length === 0 && latest.length === 0 && (
                  <p className="text-sm text-muted-foreground">Mais notícias em breve.</p>
                )}
              </div>

              {/* Sidebar */}
              <aside className="space-y-4">

                {/* Mais Lidas */}
                {trending.length > 0 && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60">Mais Lidas</h3>
                    </div>
                    <div className="divide-y divide-border/50">
                      {trending.map((a, i) => (
                        <Link key={a.id} to={`/artigo/${a.id}`}
                          className="group flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                          <span className="text-lg font-black text-muted-foreground/20 font-display leading-none mt-0.5 w-5 flex-shrink-0 tabular-nums">
                            {i + 1}
                          </span>
                          <p className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-3">
                            {a.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* FinanceChat */}
                <Link to="/chat" className="group block bg-foreground rounded-xl p-4 hover:opacity-95 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-background">FinanceChat IA</p>
                      <span className="text-[10px] text-emerald-400 font-medium">● ao vivo</span>
                    </div>
                  </div>
                  <p className="text-xs text-background/50 leading-relaxed">
                    Pergunte sobre qualquer ativo, empresa ou notícia do mercado financeiro.
                  </p>
                  <span className="text-xs text-primary font-semibold mt-2 block group-hover:underline">Acessar chat →</span>
                </Link>

                {/* Empresas */}
                <CompaniesInFocus />

                {/* Agenda */}
                <EconomicCalendar />

                {/* Newsletter */}
                <NewsletterForm />

                {/* Disclaimer */}
                <div className="flex items-start gap-2 px-3 py-2.5 bg-muted/50 rounded-lg border border-border/50">
                  <AlertTriangle className="w-3 h-3 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                    Conteúdo gerado por IA. Não constitui recomendação de investimento.
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