import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';

const moodConfig = {
  otimista: { cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  cauteloso: { cls: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  pessimista: { cls: 'text-red-600 bg-red-50 border-red-200', dot: 'bg-red-500' },
};

const bulletIcons = ['📌', '👁️', '📅'];
const bulletLabels = ['Principal movimento', 'Ativos em atenção', 'Evento para monitorar'];

export default function DailySummaryBar({ articles = [] }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (articles.length === 0) return;
    setLoading(true);
    const context = articles.slice(0, 10).map((a) =>
      `- ${a.title}${a.tickers ? ` [${a.tickers}]` : ''}`
    ).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é analista financeiro sênior. Analise as notícias do dia e escreva exatamente 3 bullets executivos para investidores brasileiros.

Bullet 1 — Principal movimento do mercado hoje (max 20 palavras)
Bullet 2 — Ativos que merecem atenção e por quê (max 20 palavras, mencione tickers)
Bullet 3 — Evento mais importante para monitorar nos próximos dias (max 20 palavras)

Notícias:
${context}

Seja assertivo, concreto e não genérico. Sem URLs.`,
      response_json_schema: {
        type: 'object',
        properties: {
          bullets: { type: 'array', items: { type: 'string' } },
          mood: { type: 'string' },
        },
      },
    });
    setSummary(result);
    setLoading(false);
  };

  // Auto-generate on mount when articles are available
  useEffect(() => {
    if (articles.length >= 3 && !summary && !loading) {
      generate();
    }
  }, [articles.length]);

  const mood = summary?.mood;
  const moodCfg = moodConfig[mood] || null;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-foreground/[0.03] border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold">Resumo IA do Dia</p>
            <p className="text-[10px] text-muted-foreground">Análise automática para investidores</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mood && moodCfg && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${moodCfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${moodCfg.dot}`} />
              {mood}
            </span>
          )}
          {!loading && summary && (
            <button onClick={generate} className="text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && !summary && (
          <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
            Analisando as principais notícias do dia...
          </div>
        )}

        {!loading && !summary && articles.length < 3 && (
          <p className="text-sm text-muted-foreground py-2">Aguardando mais notícias para gerar o resumo do dia.</p>
        )}

        {summary?.bullets && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {summary.bullets.slice(0, 3).map((b, i) => (
              <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{bulletIcons[i]}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{bulletLabels[i]}</span>
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">{b}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}