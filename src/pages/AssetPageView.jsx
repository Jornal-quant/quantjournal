import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, TrendingUp, Building2, Newspaper,
  Sparkles, Loader2, RefreshCw, ChevronRight
} from 'lucide-react';
import ArticleCard from '../components/news/ArticleCard';
import { toast } from 'sonner';

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
      return articles.filter((a) =>
        a.title?.toLowerCase().includes(kw) ||
        a.summary?.toLowerCase().includes(kw) ||
        a.affected_companies?.toLowerCase().includes(kw) ||
        a.tickers?.toLowerCase().includes(kw) ||
        a.tags?.toLowerCase().includes(kw)
      );
    },
  });

  const generateAISummary = async () => {
    setLoadingAI(true);
    const recentTitles = allArticles.slice(0, 5).map((a) => `- ${a.title}: ${a.summary}`).join('\n');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista financeiro sênior. Com base nas notícias recentes sobre "${asset?.name || slug}", gere uma análise executiva respondendo:

Notícias recentes:
${recentTitles || 'Sem notícias recentes disponíveis.'}

Responda em JSON com:
- cenario_atual: resumo do cenário atual (2-3 frases)
- quem_ganha: quem se beneficia neste cenário (investidores, setores)
- quem_perde: quem é impactado negativamente
- impacto_bolsa: impacto para a bolsa/ações
- impacto_dolar: relação com o câmbio
- impacto_selic: relação com os juros
- o_que_observar: o que investidores devem monitorar nos próximos dias
- perspectiva: "positiva", "negativa" ou "neutra"`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          cenario_atual: { type: 'string' },
          quem_ganha: { type: 'string' },
          quem_perde: { type: 'string' },
          impacto_bolsa: { type: 'string' },
          impacto_dolar: { type: 'string' },
          impacto_selic: { type: 'string' },
          o_que_observar: { type: 'string' },
          perspectiva: { type: 'string' },
        },
      },
    });
    setAiSummary(result);
    setLoadingAI(false);
  };

  const displayName = asset?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
  const displayTicker = asset?.ticker;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* Hero */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold font-display">{displayName}</h1>
                {displayTicker && (
                  <Badge className="font-mono text-xs bg-primary/10 text-primary border border-primary/20">
                    {displayTicker}
                  </Badge>
                )}
                {asset?.type && (
                  <Badge variant="outline" className="text-xs capitalize">{asset.type}</Badge>
                )}
              </div>
              {asset?.description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">{asset.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={generateAISummary}
              disabled={loadingAI}
              className="gap-2"
            >
              {loadingAI ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Análise IA</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* AI Analysis Panel */}
      {aiSummary && (
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg">Análise de IA</h2>
            </div>
            <Badge className={
              aiSummary.perspectiva === 'positiva' ? 'bg-chart-2/10 text-chart-2 border-chart-2/20' :
              aiSummary.perspectiva === 'negativa' ? 'bg-destructive/10 text-destructive border-destructive/20' :
              'bg-muted text-muted-foreground'
            }>
              Perspectiva: {aiSummary.perspectiva}
            </Badge>
          </div>

          {aiSummary.cenario_atual && (
            <p className="text-foreground/80 mb-4 leading-relaxed">{aiSummary.cenario_atual}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { label: '✅ Quem ganha', value: aiSummary.quem_ganha, color: 'border-chart-2/30 bg-chart-2/5' },
              { label: '❌ Quem perde', value: aiSummary.quem_perde, color: 'border-destructive/30 bg-destructive/5' },
              { label: '📈 Impacto Bolsa', value: aiSummary.impacto_bolsa, color: 'border-primary/30 bg-primary/5' },
              { label: '💵 Impacto Dólar', value: aiSummary.impacto_dolar, color: 'border-accent/30 bg-accent/5' },
              { label: '🏦 Impacto Selic', value: aiSummary.impacto_selic, color: 'border-chart-5/30 bg-chart-5/5' },
              { label: '👁 O que observar', value: aiSummary.o_que_observar, color: 'border-border bg-muted/50' },
            ].filter(i => i.value).map((item) => (
              <div key={item.label} className={`rounded-lg p-3 border ${item.color}`}>
                <span className="text-xs font-semibold text-muted-foreground block mb-1">{item.label}</span>
                <p className="text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold font-display">
              Notícias sobre {displayName}
            </h2>
            <Badge variant="outline" className="text-xs">{allArticles.length}</Badge>
          </div>

          {loadingArticles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video rounded-xl" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : allArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allArticles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma notícia encontrada sobre {displayName}.</p>
              <Button className="mt-4 gap-2" variant="outline" onClick={generateAISummary} disabled={loadingAI}>
                <Sparkles className="w-4 h-4" /> Gerar análise mesmo assim
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold mb-3 text-sm">Outros ativos</h3>
            {['petrobras', 'vale', 'itau', 'nubank', 'selic', 'dolar', 'bitcoin'].filter(s => s !== slug).map((s) => (
              <Link key={s} to={`/ativo/${s}`} className="flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground border-b border-border/50 last:border-0 group">
                <span className="capitalize font-medium group-hover:text-primary transition-colors">{s}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}