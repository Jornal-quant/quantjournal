import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, TrendingDown, Zap, BarChart3, Shield, Clock, Globe, Search, MessageSquare, Bell } from 'lucide-react';

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

const CAT_LABEL = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Câmbio',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

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

const FEATURES = [
  { icon: BarChart3,     title: 'Radar de mercado',       desc: 'Acompanhe múltiplos ativos com dados atualizados continuamente.' },
  { icon: Zap,           title: 'Análise por IA',          desc: 'Resumos estruturados gerados automaticamente com contexto e impactos.' },
  { icon: Search,        title: 'Busca inteligente',       desc: 'Filtre por ativo, categoria, sentimento e período de publicação.' },
  { icon: MessageSquare, title: 'Market Chat',             desc: 'Converse com IA especializada em mercado financeiro.' },
  { icon: Globe,         title: 'Cobertura global',        desc: 'Fontes nacionais e internacionais em tempo real.' },
  { icon: Shield,        title: 'Transparência',           desc: 'Fontes, confiança da IA e histórico de atualizações em cada artigo.' },
];

function SectionLabel({ label, href, count }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-px h-4 rounded-full bg-white/15" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/35">{label}</span>
        {count != null && <span className="font-mono text-[9px] text-white/15">{count}</span>}
      </div>
      {href && (
        <Link to={href} className="font-mono text-[10px] text-white/25 hover:text-white/60 transition-colors duration-150">
          ver todas →
        </Link>
      )}
    </div>
  );
}

function SkeletonCards({ n = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/6 overflow-hidden" style={{ backgroundColor: '#111110' }}>
          <Skeleton className="h-40 w-full rounded-none bg-white/6" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-20 bg-white/6" />
            <Skeleton className="h-4 w-full bg-white/6" />
            <Skeleton className="h-4 w-3/4 bg-white/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── HERO LANDING (empty state) ─── */
function LandingHero() {
  return (
    <section className="border-b border-white/6" style={{ background: 'linear-gradient(135deg, #0E0E0C 0%, #131311 60%, #161614 100%)' }}>
      <div className="max-w-screen-2xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-14 items-start">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/25">
                Plataforma de inteligência financeira · IA
              </span>
            </div>
            <h1 className="font-mono text-4xl md:text-6xl font-semibold leading-[1.08] tracking-tight text-white mb-5">
              Entenda o mercado<br />
              <span style={{ color: '#8C8478' }}>antes de todo mundo</span>
            </h1>
            <p className="font-sans text-base text-white/40 leading-relaxed mb-2 max-w-lg">
              O FinAI Pulse monitora fontes financeiras globais, identifica eventos relevantes e transforma dados complexos em análises claras e rastreáveis.
            </p>
            <p className="font-sans text-sm text-white/22 leading-relaxed mb-10 max-w-lg">
              Para investidores, analistas e profissionais que precisam de contexto e velocidade — sem ruído.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/busca" className="inline-flex items-center gap-2 font-mono text-[13px] font-semibold bg-white text-black px-5 py-2.5 rounded-lg hover:bg-white/90 transition-colors duration-150">
                Explorar análises <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/ativos" className="inline-flex items-center gap-2 font-mono text-[13px] font-medium border border-white/15 text-white/60 px-5 py-2.5 rounded-lg hover:border-white/30 hover:text-white/90 transition-all duration-150">
                Ver ativos
              </Link>
              <Link to="/chat" className="inline-flex items-center gap-2 font-mono text-[13px] font-medium border border-white/15 text-white/60 px-5 py-2.5 rounded-lg hover:border-white/30 hover:text-white/90 transition-all duration-150">
                <Zap className="w-3.5 h-3.5" /> IA Chat
              </Link>
            </div>
          </div>

          {/* Value prop card */}
          <div className="border border-white/8 rounded-xl p-5 bg-white/3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-white/20 mb-4">O que o FinAI Pulse faz</p>
            <div className="space-y-3">
              {[
                'Monitora fontes financeiras globais continuamente',
                'Analisa e classifica notícias por relevância e sentimento',
                'Gera resumos estruturados por IA — não por templates',
                'Exibe fontes consultadas em cada artigo',
                'Identifica ativos e setores impactados automaticamente',
                'Sem linguagem de recomendação financeira',
              ].map((v) => (
                <div key={v} className="flex items-start gap-2.5">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full flex-shrink-0 mt-2" />
                  <p className="font-sans text-[13px] text-white/40 leading-snug">{v}</p>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-white/6 mt-4">
              <p className="font-sans text-[11px] text-white/18 leading-relaxed">
                Conteúdo informativo. Não constitui recomendação de investimento.{' '}
                <Link to="/metodologia" className="underline hover:text-white/35 transition-colors duration-150">Metodologia</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES GRID (empty state) ─── */
function FeaturesGrid() {
  return (
    <section className="border-b border-white/6" style={{ backgroundColor: '#111110' }}>
      <div className="max-w-screen-2xl mx-auto px-6 py-14">
        <SectionLabel label="Principais recursos" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="border border-white/6 rounded-xl p-4 hover:bg-white/3 hover:border-white/10 transition-all duration-200">
              <f.icon className="w-4 h-4 text-white/30 mb-3" />
              <h3 className="font-mono text-[12px] font-semibold text-white/70 mb-1.5">{f.title}</h3>
              <p className="font-sans text-[12px] text-white/30 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SIDEBAR ─── */
function Sidebar({ trending }) {
  return (
    <aside className="space-y-4 min-w-0">
      {/* Trending */}
      {trending.length > 0 && (
        <div className="border border-white/8 rounded-xl overflow-hidden" style={{ backgroundColor: '#111110' }}>
          <div className="px-4 py-2.5 border-b border-white/6 bg-white/3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/35">Mais lidas</span>
          </div>
          <div className="divide-y divide-white/5">
            {trending.map((a, i) => (
              <Link key={a.id} to={`/artigo/${a.id}`}
                className="group flex items-start gap-3 px-4 py-3 hover:bg-white/4 transition-colors duration-150">
                <span className="font-mono text-[18px] font-semibold text-white/8 leading-none mt-0.5 w-5 flex-shrink-0 tabular-nums">{i + 1}</span>
                <p className="font-mono text-[13px] font-medium leading-snug text-white/55 group-hover:text-white/85 transition-colors duration-150 line-clamp-2">{a.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Chat CTA */}
      <Link to="/chat" className="group block border border-white/8 rounded-xl p-4 hover:border-white/14 hover:bg-white/3 transition-all duration-200" style={{ backgroundColor: '#111110' }}>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 bg-white/8 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white/50" />
          </div>
          <div>
            <p className="font-mono text-[12px] font-semibold text-white/75">Market Chat IA</p>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
              <span className="font-mono text-[9px] text-emerald-400">ao vivo</span>
            </div>
          </div>
        </div>
        <p className="font-sans text-[12px] text-white/28 leading-relaxed mb-2.5">Pergunte sobre qualquer ativo, empresa ou notícia.</p>
        <span className="font-mono text-[11px] text-white/25 group-hover:text-white/55 transition-colors duration-150">Acessar chat →</span>
      </Link>

      <CompaniesInFocus />
      <EconomicCalendar />
      <NewsletterForm />

      <p className="font-mono text-[9px] text-white/15 leading-relaxed px-1">
        Conteúdo gerado por IA com fins informativos. Não constitui recomendação de investimento.
      </p>
    </aside>
  );
}

/* ─── MAIN PAGE ─── */
export default function Home() {
  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['articles-home'],
    queryFn: () => base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 120),
  });

  const articles = useMemo(() => dedupe(raw), [raw]);

  const heroArticles = useMemo(() => {
    const priority = articles.filter((a) => a.is_featured || a.relevance === 'urgente' || a.relevance === 'alta');
    return (priority.length >= 1 ? priority : articles).slice(0, 4);
  }, [articles]);

  const heroIds = useMemo(() => new Set(heroArticles.map((a) => a.id)), [heroArticles]);

  const latest = useMemo(() =>
    articles.filter((a) => !heroIds.has(a.id)).slice(0, 8),
  [articles, heroIds]);

  const latestIds = useMemo(() => new Set(latest.map((a) => a.id)), [latest]);

  const byCategory = useMemo(() => {
    const map = {};
    articles.forEach((a) => {
      if (heroIds.has(a.id) || latestIds.has(a.id)) return;
      if (!map[a.category]) map[a.category] = [];
      if (map[a.category].length < 4) map[a.category].push(a);
    });
    return map;
  }, [articles, heroIds, latestIds]);

  const activeCategories = CATEGORY_SECTIONS.filter((c) => (byCategory[c.key]?.length || 0) >= 1);

  const trending = useMemo(() =>
    [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 7),
  [articles]);

  const urgent = useMemo(() => articles.filter((a) => a.relevance === 'urgente'), [articles]);
  const hasContent = articles.length > 0;

  return (
    <div style={{ backgroundColor: '#0C0C0A' }}>
      <TickerBar />

      {/* Urgente bar */}
      {urgent.length > 0 && (
        <div className="border-b border-red-500/20" style={{ backgroundColor: 'rgba(248,113,113,0.08)' }}>
          <div className="max-w-screen-2xl mx-auto px-6 py-1.5 flex items-center gap-3 overflow-hidden">
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-red-500/80 text-white px-2 py-0.5 rounded-sm flex-shrink-0">Urgente</span>
            <div className="flex gap-6 overflow-x-auto scrollbar-none">
              {urgent.map((a) => (
                <Link key={a.id} to={`/artigo/${a.id}`}
                  className="font-sans text-[12px] text-red-400/70 whitespace-nowrap hover:text-red-300 transition-colors duration-150 flex-shrink-0">
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Landing hero — shows when no content */}
      {!hasContent && !isLoading && <LandingHero />}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="max-w-screen-2xl mx-auto px-6 py-10">
          <SkeletonCards n={4} />
        </div>
      )}

      {hasContent && (
        <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-10">
          {/* Market data */}
          <div className="space-y-3">
            <MarketRadar />
            <DailySummaryBar articles={articles} />
          </div>

          {/* Hero section */}
          <section>
            <SectionLabel label="Manchete do dia" />
            <HeroSection articles={heroArticles} />
          </section>

          {/* Main + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            <div className="space-y-10 min-w-0">

              {/* Latest */}
              {latest.length > 0 && (
                <section>
                  <SectionLabel label="Últimas notícias" count={`${latest.length} artigos`} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {latest.map((a) => <ArticleCard key={a.id} article={a} />)}
                  </div>
                </section>
              )}

              {/* Category sections */}
              {activeCategories.map(({ key, label }) => (
                <section key={key}>
                  <SectionLabel label={label} href={`/categoria/${key}`} count={`${byCategory[key].length}`} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {byCategory[key].map((a) => <ArticleCard key={a.id} article={a} />)}
                  </div>
                </section>
              ))}
            </div>

            <Sidebar trending={trending} />
          </div>
        </div>
      )}

      {/* No content → features grid + CTA */}
      {!hasContent && !isLoading && (
        <>
          <FeaturesGrid />
          <div className="max-w-screen-2xl mx-auto px-6 py-16 text-center space-y-4">
            <div className="font-mono text-5xl text-white/6 mb-4">⬡</div>
            <h2 className="font-mono text-[18px] font-semibold text-white/70">Nenhum conteúdo publicado ainda</h2>
            <p className="font-sans text-[13px] text-white/30">Acesse o painel de administração para gerar artigos com IA.</p>
            <Link to="/admin" className="inline-flex items-center gap-2 font-mono text-[13px] font-semibold bg-white text-black px-6 py-2.5 rounded-lg hover:bg-white/90 transition-colors duration-150 mt-2">
              Ir para o Admin <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}

      {/* Global disclaimer */}
      <div className="border-t border-white/5 mt-4" style={{ backgroundColor: '#0A0A08' }}>
        <div className="max-w-screen-2xl mx-auto px-6 py-5">
          <div className="flex items-start gap-2.5 max-w-4xl mx-auto">
            <Shield className="w-3.5 h-3.5 text-white/15 flex-shrink-0 mt-0.5" />
            <p className="font-sans text-[11px] text-white/20 leading-relaxed text-center">
              O conteúdo do FinAI Pulse é meramente informativo e educacional. Não constitui recomendação de investimento, consultoria financeira, oferta de compra ou venda de ativos, nem garantia de resultados. Sempre consulte fontes oficiais e profissionais qualificados antes de tomar decisões financeiras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}