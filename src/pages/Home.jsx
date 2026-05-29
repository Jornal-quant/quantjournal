import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Zap, RefreshCw, BarChart3, Brain, Search, MessageSquare, Bell, Shield, Clock, Globe } from 'lucide-react';

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

const HOW_IT_WORKS = [
  { n: '01', title: 'Coleta contínua', desc: 'Monitoramos fontes financeiras globais: agências de notícias, bancos centrais, relatórios e dados de mercado em tempo real.' },
  { n: '02', title: 'Agrupamento por evento', desc: 'A IA identifica eventos semelhantes de múltiplas fontes, elimina duplicidades e cria uma visão consolidada de cada fato relevante.' },
  { n: '03', title: 'Análise e contexto', desc: 'Geramos resumos estruturados com contexto de mercado, ativos impactados e possível repercussão — sem linguagem de recomendação.' },
  { n: '04', title: 'Atualização contínua', desc: 'Artigos são atualizados automaticamente conforme novas informações surgem, com histórico de versões e rastreabilidade de fontes.' },
];

const FEATURES = [
  { icon: BarChart3, title: 'Radar de mercado',       desc: 'Acompanhe preços, variações e sentimento de múltiplos ativos em tempo real.' },
  { icon: Brain,     title: 'Análise por IA',          desc: 'Resumos estruturados, contexto e impactos gerados automaticamente por modelos de linguagem avançados.' },
  { icon: RefreshCw, title: 'Artigos vivos',           desc: 'O conteúdo evolui com o mercado. Cada artigo mantém um histórico de atualizações e fontes consultadas.' },
  { icon: Search,    title: 'Busca inteligente',       desc: 'Filtre por ativo, categoria, sentimento, impacto, país e período de publicação.' },
  { icon: MessageSquare, title: 'Market Chat',         desc: 'Converse com IA especializada em mercado financeiro usando o contexto das notícias da plataforma.' },
  { icon: Bell,      title: 'Alertas personalizados', desc: 'Defina alertas para ativos, eventos e temas que você acompanha.' },
  { icon: Globe,     title: 'Cobertura global',        desc: 'Fontes nacionais e internacionais: Brasil, EUA, Europa, Ásia e mercados emergentes.' },
  { icon: Shield,    title: 'Transparência editorial', desc: 'Cada artigo exibe fontes, confiança da IA, horário de publicação e histórico de atualizações.' },
];

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

const VALUE_PROPS = [
  'Monitoramento de fontes financeiras globais',
  'Análises estruturadas por IA, não por templates',
  'Fontes rastreáveis em cada artigo',
  'Sentimento e impacto identificados automaticamente',
  'Atualização contínua — artigos evoluem com o mercado',
  'Sem linguagem de recomendação financeira',
];

function LandingHero({ articles }) {
  const hasArticles = articles.length > 0;
  return (
    <section className="border-b border-ds-border bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 items-start">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 bg-ds-up rounded-full animate-pulse" />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-white/30">
                Plataforma de análise financeira · impulsionada por IA
              </span>
            </div>
            <h1 className="font-mono text-3xl md:text-5xl font-semibold leading-tight tracking-tight text-white mb-5">
              Entenda o mercado<br />
              <span style={{ color: '#8C8478' }}>antes de todo mundo</span>
            </h1>
            <p className="font-sans text-base text-white/45 leading-relaxed mb-3 max-w-xl">
              O FinAI Pulse monitora notícias globais, identifica eventos relevantes e transforma informações financeiras complexas em análises claras, rápidas e rastreáveis — para investidores que precisam entender o mercado, não apenas acompanhá-lo.
            </p>
            <p className="font-sans text-sm text-white/25 leading-relaxed mb-8 max-w-xl">
              Para investidores individuais, analistas e profissionais do mercado financeiro que precisam de contexto e velocidade, sem ruído e sem viés editorial.
            </p>
            <div className="flex flex-wrap gap-3">
              {hasArticles ? (
                <>
                  <Link to="/busca" className="inline-flex items-center gap-2 font-mono text-sm font-semibold bg-white text-foreground px-5 py-2.5 rounded hover:opacity-90 transition-opacity">
                    Explorar análises <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/ativos" className="inline-flex items-center gap-2 font-mono text-sm font-medium border border-white/20 text-white px-5 py-2.5 rounded hover:border-white/40 transition-colors">
                    Ver ativos
                  </Link>
                  <Link to="/chat" className="inline-flex items-center gap-2 font-mono text-sm font-medium border border-white/20 text-white px-5 py-2.5 rounded hover:border-white/40 transition-colors">
                    ⬡ Market Chat
                  </Link>
                </>
              ) : (
                <Link to="/admin" className="inline-flex items-center gap-2 font-mono text-sm font-semibold bg-white text-foreground px-5 py-2.5 rounded hover:opacity-90 transition-opacity">
                  Acessar Admin → Gerar conteúdo
                </Link>
              )}
            </div>
          </div>

          {/* Value props card */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-5 space-y-2.5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">O que o FinAI Pulse faz</p>
            {VALUE_PROPS.map((v) => (
              <div key={v} className="flex items-start gap-2.5">
                <span className="w-1 h-1 bg-ds-up rounded-full flex-shrink-0 mt-2" />
                <p className="font-sans text-sm text-white/50 leading-snug">{v}</p>
              </div>
            ))}
            <div className="pt-3 border-t border-white/10 mt-3">
              <p className="font-sans text-[11px] text-white/20 leading-relaxed">
                Conteúdo informativo. Não constitui recomendação de investimento.{' '}
                <Link to="/metodologia" className="underline hover:text-white/40 transition-colors">Ver metodologia</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-b border-ds-border bg-ds-surface2">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <SectionHeader label="Como funciona" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-ds-border">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.n} className="bg-ds-surface2 p-6">
              <div className="font-mono text-3xl font-semibold text-foreground/10 mb-4">{s.n}</div>
              <h3 className="font-mono text-sm font-semibold mb-2">{s.title}</h3>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  return (
    <section className="border-b border-ds-border">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <SectionHeader label="Principais recursos" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="border border-ds-border rounded-lg p-4 hover:bg-ds-surface2 transition-colors">
              <f.icon className="w-5 h-5 text-muted-foreground mb-3" />
              <h3 className="font-mono text-xs font-semibold mb-1.5">{f.title}</h3>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="border-b border-ds-border bg-foreground">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-white/30" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/30">Confiança e transparência</span>
            </div>
            <h2 className="font-mono text-2xl font-semibold text-white mb-4 leading-tight">
              Cada artigo é rastreável,<br />cada dado é referenciado
            </h2>
            <p className="font-sans text-sm text-white/40 leading-relaxed mb-6">
              O FinAI Pulse não inventa dados. Cada análise é gerada com base em fontes identificadas, com horário de publicação, nível de confiança da IA e histórico de atualizações.
            </p>
            <Link to="/metodologia" className="inline-flex items-center gap-2 font-mono text-sm font-medium text-white/60 hover:text-white transition-colors">
              Ver metodologia editorial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { icon: Clock, label: 'Horário de publicação e última atualização visíveis em todos os artigos' },
              { icon: Globe, label: 'Fontes consultadas exibidas e linkadas ao final de cada análise' },
              { icon: Brain, label: 'Nível de confiança da IA calculado e exibido para transparência' },
              { icon: Shield, label: 'Aviso de não recomendação de investimento em todo conteúdo' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <item.icon className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                <p className="font-sans text-xs text-white/50 leading-relaxed">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

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
    <>
      <TickerBar />
      <LandingHero articles={articles} />

      {/* Breaking bar */}
      {urgent.length > 0 && (
        <div className="bg-ds-dn border-b border-ds-dn/50">
          <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center gap-3 overflow-hidden">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-widest bg-white text-ds-dn px-2 py-0.5 rounded-sm flex-shrink-0">Urgente</span>
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

      {/* How it works — always show */}
      <HowItWorks />

      {hasContent ? (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
          {/* Radar + Resumo IA */}
          <div className="space-y-3">
            <MarketRadar />
            <DailySummaryBar articles={articles} />
          </div>

          {/* Manchete */}
          <section>
            <SectionHeader label="Manchete do Dia" />
            <HeroSection articles={heroArticles} />
          </section>

          {/* Main + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-10">
            <div className="space-y-12 min-w-0">
              {latest.length > 0 && (
                <section>
                  <SectionHeader label="Últimas Notícias" counter={`${latest.length} artigos`} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {latest.map((a) => <ArticleCard key={a.id} article={a} />)}
                  </div>
                </section>
              )}
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

              <Link to="/chat" className="group block bg-foreground rounded-lg p-4 hover:opacity-95 transition-opacity">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center">
                    <span className="font-mono text-sm text-white/60">⬡</span>
                  </div>
                  <div>
                    <p className="font-mono text-[12px] font-semibold text-white">Market Chat IA</p>
                    <span className="font-mono text-[9px] text-ds-up font-medium">● ao vivo</span>
                  </div>
                </div>
                <p className="font-sans text-xs text-white/35 leading-relaxed">Pergunte sobre qualquer ativo, empresa ou notícia.</p>
                <span className="font-mono text-[11px] text-white/40 group-hover:text-white/70 transition-colors mt-2 block">Acessar chat →</span>
              </Link>

              <CompaniesInFocus />
              <EconomicCalendar />
              <NewsletterForm />
              <p className="font-mono text-[9px] text-muted-foreground/30 leading-relaxed px-1">
                Conteúdo gerado por IA com fins informativos. Não constitui recomendação de investimento.
              </p>
            </aside>
          </div>
        </div>
      ) : (
        <>
          <FeaturesGrid />
          <div className="max-w-7xl mx-auto px-6 py-14 text-center space-y-4">
            <div className="font-mono text-4xl text-muted-foreground/10">⬡</div>
            <h2 className="font-mono text-lg font-semibold">Nenhum conteúdo publicado ainda</h2>
            <p className="font-sans text-sm text-muted-foreground">Acesse o painel de administração para gerar artigos com IA.</p>
            <Link to="/admin" className="inline-flex items-center gap-2 font-mono text-sm font-semibold bg-foreground text-background px-5 py-2.5 rounded hover:opacity-90 transition-opacity mt-2">
              → Ir para o Admin
            </Link>
          </div>
        </>
      )}

      <FeaturesGrid />
      <TrustSection />

      {/* Global disclaimer */}
      <div className="border-t border-ds-border bg-ds-surface2">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="font-sans text-[11px] text-muted-foreground/60 leading-relaxed text-center max-w-4xl mx-auto">
            O conteúdo do FinAI Pulse é meramente informativo e educacional. Não constitui recomendação de investimento, consultoria financeira, oferta de compra ou venda de ativos, nem garantia de resultados. Informações podem conter atrasos, erros ou imprecisões. Sempre consulte fontes oficiais e profissionais qualificados antes de tomar decisões financeiras.
          </p>
        </div>
      </div>
    </>
  );
}