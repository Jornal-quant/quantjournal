import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Sparkles, Loader2, TrendingUp, TrendingDown, Minus, MessageSquare } from 'lucide-react';
import { formatMarketPrice, formatChangePercent } from '@/lib/utils';
import ArticleCard from '../components/news/ArticleCard';

const OTHER_ASSETS = [
  { slug: 'petrobras', name: 'Petrobras', ticker: 'PETR4' },
  { slug: 'vale', name: 'Vale', ticker: 'VALE3' },
  { slug: 'itau', name: 'Itaú', ticker: 'ITUB4' },
  { slug: 'nubank', name: 'Nubank', ticker: 'NU' },
  { slug: 'selic', name: 'Taxa SELIC', ticker: 'SELIC' },
  { slug: 'dolar', name: 'Dólar', ticker: 'USD/BRL' },
  { slug: 'bitcoin', name: 'Bitcoin', ticker: 'BTC' },
  { slug: 'ibovespa', name: 'Ibovespa', ticker: 'IBOV' },
];

function SentimentIcon({ s }) {
  if (s === 'positivo') return <TrendingUp className="w-4 h-4 text-ds-up" />;
  if (s === 'negativo') return <TrendingDown className="w-4 h-4 text-ds-dn" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function AISummaryPanel({ summary, name }) {
  if (!summary) return null;
  const perspClasses = {
    positiva: 'text-ds-up bg-ds-up-bg border border-ds-up/20',
    negativa: 'text-ds-dn bg-ds-dn-bg border border-ds-dn/20',
    neutra: 'text-muted-foreground bg-ds-surface3 border border-ds-border',
  };
  const cls = perspClasses[summary.perspectiva] || perspClasses.neutra;

  const rows = [
    { label: 'Cenário atual',  value: summary.cenario_atual },
    { label: 'Favorece',       value: summary.quem_ganha },
    { label: 'Pressiona',      value: summary.quem_perde },
    { label: 'Impacto bolsa',  value: summary.impacto_bolsa },
    { label: 'Impacto câmbio', value: summary.impacto_dolar },
    { label: 'Impacto juros',  value: summary.impacto_selic },
    { label: 'O que monitorar', value: summary.o_que_observar },
  ].filter((r) => r.value);

  return (
    <div className="border border-ds-border rounded-lg overflow-hidden mb-8">
      <div className="flex items-center justify-between px-4 py-3 bg-foreground">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-background">⬡ Análise IA · {name}</span>
        </div>
        <span className={`font-mono text-[9px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${cls}`}>
          Perspectiva {summary.perspectiva}
        </span>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-ds-surface">
        {rows.map((r) => (
          <div key={r.label} className="bg-ds-surface2 border border-ds-border rounded p-3">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{r.label}</p>
            <p className="font-sans text-sm text-foreground/90 leading-relaxed">{r.value}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-ds-border bg-ds-surface2">
        <p className="font-sans text-[11px] text-muted-foreground">⚠️ Análise informativa gerada por IA. Não constitui recomendação de investimento.</p>
      </div>
    </div>
  );
}

export default function AssetPageView() {
  const { slug } = useParams();
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const { data: assets = [] } = useQuery({
    queryKey: ['asset', slug],
    queryFn: () => base44.entities.AssetPage.filter({ slug }),
  });
  const asset = assets[0];

  const { data: allArticles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ['asset-articles', slug],
    queryFn: async () => {
      const articles = await base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 100);
      const kw = slug.toLowerCase();
      const name = asset?.name?.toLowerCase() || kw;
      const ticker = asset?.ticker?.toLowerCase() || '';
      return articles.filter((a) =>
        a.title?.toLowerCase().includes(kw) ||
        a.title?.toLowerCase().includes(name) ||
        a.summary?.toLowerCase().includes(kw) ||
        a.affected_companies?.toLowerCase().includes(kw) ||
        a.affected_companies?.toLowerCase().includes(name) ||
        a.tickers?.toLowerCase().includes(ticker || kw) ||
        a.tags?.toLowerCase().includes(kw)
      );
    },
    enabled: true,
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ['snapshots-asset'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
    staleTime: 5 * 60 * 1000,
  });

  const snapshot = snapshots.find((s) =>
    s.symbol?.toLowerCase() === (asset?.ticker?.toLowerCase() || slug) ||
    s.name?.toLowerCase().includes(slug)
  );

  const generateAI = async () => {
    if (loadingAI) return;
    setLoadingAI(true);
    const context = allArticles.slice(0, 6).map((a) => `- ${a.title}: ${a.summary || ''}`).join('\n');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é analista financeiro sênior do FinAI Pulse. Analise o ativo "${asset?.name || slug}" com base nas notícias recentes.

Notícias recentes:
${context || 'Sem notícias recentes sobre este ativo.'}

Responda em JSON com:
- cenario_atual: resumo do cenário atual (2-3 frases analíticas)
- quem_ganha: quem pode se beneficiar neste cenário
- quem_perde: quem pode ser pressionado
- impacto_bolsa: impacto para bolsa/ações relacionadas
- impacto_dolar: relação com câmbio
- impacto_selic: relação com juros/renda fixa
- o_que_observar: eventos e dados para monitorar
- perspectiva: "positiva", "negativa" ou "neutra"

Use linguagem analítica. NUNCA use: "compre", "venda", "vai subir", "vai cair", "garantido".`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          cenario_atual: { type: 'string' }, quem_ganha: { type: 'string' },
          quem_perde: { type: 'string' }, impacto_bolsa: { type: 'string' },
          impacto_dolar: { type: 'string' }, impacto_selic: { type: 'string' },
          o_que_observar: { type: 'string' }, perspectiva: { type: 'string' },
        },
      },
    });
    setAiSummary(result);
    setLoadingAI(false);
  };

  const displayName = asset?.name || (slug.charAt(0).toUpperCase() + slug.slice(1));
  const displayTicker = asset?.ticker;

  const up = snapshot?.change_percent > 0;
  const dn = snapshot?.change_percent < 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
      <Link to="/ativos" className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Ativos
      </Link>

      {/* Hero */}
      <div className="border border-ds-border rounded-lg p-6 mb-6 bg-ds-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-foreground rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-sm font-semibold text-white/50">
                {displayTicker?.slice(0, 3) || displayName.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-mono text-xl font-semibold">{displayName}</h1>
                {displayTicker && (
                  <span className="font-mono text-[11px] font-semibold bg-foreground text-background px-2 py-0.5 rounded-sm">{displayTicker}</span>
                )}
                {asset?.type && (
                  <span className="font-mono text-[10px] text-muted-foreground border border-ds-border px-2 py-0.5 rounded capitalize">{asset.type}</span>
                )}
              </div>
              {asset?.description && <p className="font-sans text-sm text-muted-foreground max-w-xl">{asset.description}</p>}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {snapshot && (
              <div className="text-right">
                <p className="font-mono text-2xl font-semibold">{formatMarketPrice(snapshot)}</p>
                <p className={`font-mono text-sm font-semibold flex items-center gap-1 justify-end ${dn ? 'text-ds-dn' : up ? 'text-ds-up' : 'text-muted-foreground'}`}>
                  {dn ? <TrendingDown className="w-4 h-4" /> : up ? <TrendingUp className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  {formatChangePercent(snapshot.change_percent)}
                </p>
              </div>
            )}
            <button
              onClick={generateAI}
              disabled={loadingAI}
              className="flex items-center gap-1.5 font-mono text-[11px] font-semibold bg-foreground text-background px-4 py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-40">
              {loadingAI ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando...</> : <><Sparkles className="w-3.5 h-3.5" /> Análise IA</>}
            </button>
          </div>
        </div>
      </div>

      <AISummaryPanel summary={aiSummary} name={displayName} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_256px] gap-8">
        <div>
          {/* Notícias */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-0.5 h-4 bg-foreground/20 rounded-full" />
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Notícias sobre {displayName}
            </h2>
            <span className="font-mono text-[9px] text-muted-foreground/40">{allArticles.length}</span>
          </div>

          {loadingArticles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
            </div>
          ) : allArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allArticles.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          ) : (
            <div className="text-center py-14 border border-ds-border rounded-lg space-y-3">
              <div className="font-mono text-3xl text-muted-foreground/10">⬡</div>
              <p className="font-mono text-sm text-muted-foreground">Nenhuma notícia encontrada sobre {displayName}.</p>
              <button onClick={generateAI} disabled={loadingAI}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold bg-foreground text-background px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-40">
                <Sparkles className="w-3.5 h-3.5" /> Gerar análise IA mesmo assim
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Chat CTA */}
          <Link to={`/chat`}
            className="group block bg-foreground rounded-lg p-4 hover:opacity-95 transition-opacity">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-background/70" />
              <p className="font-mono text-[11px] font-semibold text-background">Pergunte sobre {displayName}</p>
            </div>
            <p className="font-sans text-xs text-background/70">Use o Market Chat para análises interativas sobre este ativo.</p>
            <span className="font-mono text-[11px] text-background/70 group-hover:text-background mt-2 block transition-colors">Abrir Market Chat →</span>
          </Link>

          {/* Outros ativos */}
          <div className="border border-ds-border rounded-lg overflow-hidden bg-ds-surface">
            <div className="px-4 py-2.5 border-b border-ds-border bg-ds-surface2">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Outros ativos</h3>
            </div>
            <div className="divide-y divide-ds-border">
              {OTHER_ASSETS.filter((a) => a.slug !== slug).slice(0, 6).map((a) => (
                <Link key={a.slug} to={`/ativo/${a.slug}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-ds-surface2 transition-colors group">
                  <div>
                    <p className="font-mono text-xs font-semibold group-hover:text-ds-beige transition-colors">{a.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{a.ticker}</p>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-ds-surface2 border border-ds-border rounded-lg p-3">
            <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
              As informações e análises do FinAI Pulse são de caráter informativo e educacional. Não constituem recomendação de investimento, oferta de compra ou venda de ativos.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
