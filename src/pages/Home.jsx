import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

import ArticleCard from '../components/news/ArticleCard';
import NewsletterForm from '../components/news/NewsletterForm';
import TickerBar from '../components/news/TickerBar';
import MarketRadar from '../components/home/MarketRadar';
import DailySummaryBar from '../components/home/DailySummaryBar';
import EconomicCalendar from '../components/home/EconomicCalendar';
import CompaniesInFocus from '../components/home/CompaniesInFocus';
import HeroSection from '../components/home/HeroSection';

function dedupe(arr) {
  const seen = new Set();
  return arr.filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
}

const CATEGORY_SECTIONS = [
  { key: 'bolsa',         label: 'Bolsa' },
  { key: 'economia',      label: 'Economia' },
  { key: 'internacional', label: 'Internacional' },
  { key: 'empresas',      label: 'Empresas' },
  { key: 'criptomoedas',  label: 'Criptomoedas' },
  { key: 'commodities',   label: 'Commodities' },
  { key: 'juros',         label: 'Juros & Renda Fixa' },
  { key: 'dolar',         label: 'Câmbio' },
];

function SectionHeader({ label, href, counter }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-0.5 h-4 bg-foreground/20 rounded-full" />
        <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</h2>
        {counter != null && <span className="font-mono text-[9px] text-muted-foreground/40">{counter}</span>}
      </div>
      {href && (
        <Link to={href} className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          ver todas →
        </Link>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <TickerBar />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">
        <Skeleton className="h-9 rounded-lg" />
        <Skeleton className="h-[360px] rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
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

  const articles = useMemo(() => dedupe(raw), [raw]);

  if (isLoading) return <LoadingSkeleton />;

  const priority = articles.filter((a) => a.is_featured || a.relevance === 'urgente' || a.relevance === 'alta');
  const heroArticles = priority.length >= 1 ? priority.slice(0, 4) : articles.slice(0, 4);
  const heroIds = new Set(heroArticles.map((a) => a.id));
  const latest = articles.filter((a) => !heroIds.has(a.id)).slice(0, 8);
  const latestIds = new Set(latest.map((a) => a.id));
  const usedIds = new Set([...heroIds, ...latestIds]);

  const byCategory = {};
  articles.forEach((a) => {
    if (heroIds.has(a.id)) return;
    if (!byCategory[a.category]) byCategory[a.category] = [];
    if (byCategory[a.category].length < 4) byCategory[a.category].push(a);
  });
  const activeCategories = CATEGORY_SECTIONS.filter((c) => (byCategory[c.key]?.length || 0) >= 1);

  const trending = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 7);

  const urgent = articles.filter((a) => a.relevance === 'urgente');

  return (
    <>
      <TickerBar />

      {/* Breaking */}
      {urgent.length > 0 && (
        <div className="bg-ds-dn">
          <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center gap-3 overflow-hidden">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-widest bg-white text-ds-dn px-2 py-0.5 rounded-sm flex-shrink-0">
              Urgente
            </span>
            <div className="flex gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {urgent.map((a) => (
                <Link key={a.id} to={`/artigo/${a.id}`}
                  className="font-sans text-xs text-white/80 whitespace-nowrap hover:text-white transition-colors flex-shrink-0">
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="font-mono text-4xl text-muted-foreground/20">⬡</div>
            <h2 className="font-mono text-lg font-semibold">Nenhum artigo publicado</h2>
            <p className="font-sans text-sm text-muted-foreground max-w-sm mx-auto">
              Acesse o painel admin para gerar conteúdo com IA.
            </p>
            <Link to="/admin" className="inline-block font-mono text-sm text-foreground font-semibold hover:opacity-70 transition-opacity mt-2">
              → Ir para o Admin
            </Link>
          </div>
        ) : (
          <div className="space-y-10">

            {/* Radar + Resumo */}
            <div className="space-y-3">
              <MarketRadar />
              <DailySummaryBar articles={articles} />
            </div>

            {/* Manchete */}
            <div>
              <SectionHeader label="Manchete do Dia" />
              <HeroSection articles={heroArticles} />
            </div>

            {/* Main + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-10">

              <div className="space-y-12 min-w-0">

                {/* Últimas */}
                {latest.length > 0 && (
                  <section>
                    <SectionHeader label="Últimas Notícias" counter={`${latest.length} artigos`} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {latest.map((a) => <ArticleCard key={a.id} article={a} />)}
                    </div>
                  </section>
                )}

                {/* Por categoria */}
                {activeCategories.map(({ key, label }) => (
                  <section key={key}>
                    <SectionHeader label={label} href={`/categoria/${key}`} counter={`${byCategory[key].length}`} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {byCategory[key].map((a) => <ArticleCard key={a.id} article={a} />)}
                    </div>
                  </section>
                ))}
              </div>

              {/* Sidebar */}
              <aside className="space-y-4 min-w-0">

                {/* Mais lidas */}
                {trending.length > 0 && (
                  <div className="border border-ds-border rounded-lg overflow-hidden bg-ds-surface">
                    <div className="px-4 py-2.5 border-b border-ds-border bg-ds-surface2">
                      <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Mais Lidas</h3>
                    </div>
                    <div className="divide-y divide-ds-border">
                      {trending.map((a, i) => (
                        <Link key={a.id} to={`/artigo/${a.id}`}
                          className="group flex items-start gap-3 px-4 py-3 hover:bg-ds-surface2 transition-colors">
                          <span className="font-mono text-[18px] font-semibold text-muted-foreground/15 leading-none mt-0.5 w-5 flex-shrink-0 tabular-nums">{i + 1}</span>
                          <p className="font-serif text-[13px] font-semibold leading-snug group-hover:text-ds-beige transition-colors line-clamp-2">{a.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat IA */}
                <Link to="/chat" className="group block bg-foreground rounded-lg p-4 hover:opacity-95 transition-opacity">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center">
                      <span className="font-mono text-sm text-white/60">⬡</span>
                    </div>
                    <div>
                      <p className="font-mono text-[12px] font-semibold text-white">FinanceChat IA</p>
                      <span className="font-mono text-[9px] text-ds-up font-medium">● ao vivo</span>
                    </div>
                  </div>
                  <p className="font-sans text-xs text-white/35 leading-relaxed">
                    Pergunte sobre qualquer ativo, empresa ou notícia.
                  </p>
                  <span className="font-mono text-[11px] text-white/40 group-hover:text-white/70 transition-colors mt-2 block">Acessar chat →</span>
                </Link>

                <CompaniesInFocus />
                <EconomicCalendar />
                <NewsletterForm />

                <p className="font-mono text-[9px] text-muted-foreground/30 leading-relaxed px-1">
                  Conteúdo gerado por IA. Não constitui recomendação de investimento. Consulte um assessor financeiro.
                </p>
              </aside>
            </div>
          </div>
        )}
      </div>
    </>
  );
}