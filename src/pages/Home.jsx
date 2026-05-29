import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ArticleCard from '../components/news/ArticleCard';
import NewsletterForm from '../components/news/NewsletterForm';
import TickerBar from '../components/news/TickerBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Flame, Clock, Bot, TrendingUp, TrendingDown, Minus, Globe, Cpu, BarChart2 } from 'lucide-react';

const CATEGORY_CONFIG = [
  { key: 'bolsa', label: 'Bolsa', icon: '📈' },
  { key: 'economia', label: 'Economia', icon: '🏛️' },
  { key: 'internacional', label: 'Internacional', icon: '🌐' },
  { key: 'empresas', label: 'Empresas', icon: '🏢' },
  { key: 'criptomoedas', label: 'Cripto', icon: '🪙' },
  { key: 'commodities', label: 'Commodities', icon: '🛢️' },
  { key: 'dolar', label: 'Câmbio', icon: '💵' },
  { key: 'juros', label: 'Juros & Renda Fixa', icon: '🏦' },
];

function SectionLabel({ icon, label, href }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-5 bg-primary rounded-full" />
        <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">{icon} {label}</span>
      </div>
      {href && (
        <Link to={href} className="text-xs text-primary hover:underline font-medium">Ver todas →</Link>
      )}
    </div>
  );
}

function MarketMiniCard({ snapshot }) {
  if (!snapshot) return null;
  const up = snapshot.change_percent > 0;
  const neutral = snapshot.change_percent === 0;
  const formatPrice = (s) => {
    if (s.market_type === 'rate') return `${s.price?.toFixed(2)}%`;
    if (s.market_type === 'fx') return `R$ ${s.price?.toFixed(2)}`;
    if (s.market_type === 'index') return s.price?.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    if (s.price > 1000) return `US$ ${s.price?.toLocaleString('pt-BR')}`;
    return s.price?.toFixed(2);
  };
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <span className="text-xs font-bold text-foreground">{snapshot.name || snapshot.symbol}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs">{formatPrice(snapshot)}</span>
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${neutral ? 'text-muted-foreground' : up ? 'text-emerald-600' : 'text-red-500'}`}>
          {neutral ? <Minus className="w-3 h-3" /> : up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {snapshot.change_percent != null ? `${snapshot.change_percent > 0 ? '+' : ''}${snapshot.change_percent?.toFixed(2)}%` : '—'}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles-home'],
    queryFn: () => base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 80),
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['market-snapshots'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
    staleTime: 5 * 60 * 1000,
  });

  const featured = articles.filter((a) => a.is_featured || a.relevance === 'urgente' || a.relevance === 'alta').slice(0, 4);
  const heroArticle = featured[0] || articles[0];
  const secondaryFeatured = featured.length > 1 ? featured.slice(1, 4) : articles.slice(1, 4);
  const latest = articles.slice(0, 10);
  const trending = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
  const breaking = articles.filter((a) => a.relevance === 'urgente').slice(0, 3);

  const byCategory = {};
  articles.forEach((a) => {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    if (byCategory[a.category].length < 4) byCategory[a.category].push(a);
  });

  const activeCategories = CATEGORY_CONFIG.filter((c) => byCategory[c.key]?.length > 0);

  if (isLoading) {
    return (
      <>
        <TickerBar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 space-y-3">
              <Skeleton className="aspect-[16/9] rounded-xl" />
            </div>
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TickerBar />

      {/* Breaking news bar */}
      {breaking.length > 0 && (
        <div className="bg-red-600 text-white py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white text-red-600 px-2 py-0.5 rounded flex-shrink-0">Urgente</span>
            <div className="flex gap-6 overflow-x-auto scrollbar-none">
              {breaking.map((a) => (
                <Link key={a.id} to={`/artigo/${a.id}`}
                  className="text-xs font-medium whitespace-nowrap hover:underline flex-shrink-0">
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-10">

        {/* ── MANCHETE PRINCIPAL ── */}
        {heroArticle && (
          <section>
            <SectionLabel label="Manchete" />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
              <ArticleCard article={heroArticle} variant="featured" />
              <div className="space-y-3">
                {secondaryFeatured.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="compact" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── MAIN + SIDEBAR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          <div className="space-y-10 min-w-0">
            {/* Últimas Notícias */}
            <section>
              <SectionLabel icon="🕐" label="Últimas Notícias" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latest.map((a) => <ArticleCard key={a.id} article={a} />)}
              </div>
            </section>

            {/* Category sections */}
            {activeCategories.map(({ key, label, icon }) => (
              <section key={key}>
                <SectionLabel icon={icon} label={label} href={`/categoria/${key}`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {byCategory[key].map((a) => <ArticleCard key={a.id} article={a} />)}
                </div>
              </section>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">

            {/* Mercado Agora */}
            {snapshots.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-chart-2 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">Radar do Mercado</span>
                </div>
                <div className="p-3 space-y-1.5">
                  {snapshots.slice(0, 7).map((s) => <MarketMiniCard key={s.symbol} snapshot={s} />)}
                </div>
                <div className="px-4 py-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground/50">Atualizado automaticamente</p>
                </div>
              </div>
            )}

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
                    <span className="text-xl font-black text-muted-foreground/20 font-display leading-none mt-0.5 w-5 flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-3">
                      {a.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* FinanceChat */}
            <Link to="/chat" className="group block bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-sm">FinanceChat IA</p>
                  <span className="text-[10px] text-chart-2 font-medium">Assistente ao vivo</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Pergunte sobre qualquer ativo, empresa ou notícia do mercado financeiro.</p>
              <span className="text-xs text-primary font-medium mt-2 block group-hover:underline">Acessar chat →</span>
            </Link>

            {/* Ativos em Foco */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/40">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60">Ativos em Foco</h3>
              </div>
              <div className="p-3 flex flex-wrap gap-1.5">
                {['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'IBOV', 'SELIC', 'BTC', 'USD/BRL'].map((t) => (
                  <Link key={t} to={`/busca?q=${t}`}
                    className="text-[11px] px-2.5 py-1 bg-muted hover:bg-primary/10 hover:text-primary rounded-md transition-colors font-mono font-bold">
                    {t}
                  </Link>
                ))}
                <Link to="/ativos" className="text-[11px] px-2 py-1 text-primary hover:underline font-medium">ver todos →</Link>
              </div>
            </div>

            <NewsletterForm />
          </aside>
        </div>
      </div>
    </>
  );
}