import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw } from 'lucide-react';

const moodConfig = {
  otimista:  { cls: 'text-ds-up bg-ds-up-bg border border-ds-up/20',    dot: 'bg-ds-up' },
  cauteloso: { cls: 'text-amber-700 bg-amber-50 border border-amber-200', dot: 'bg-amber-500' },
  pessimista:{ cls: 'text-ds-dn bg-ds-dn-bg border border-ds-dn/20',    dot: 'bg-ds-dn' },
};

const BULLET_LABELS = ['Principal movimento', 'Ativos em atenção', 'Monitorar'];
const BULLET_ICONS  = ['01', '02', '03'];

export default function DailySummaryBar({ articles = [] }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (articles.length === 0) return;
    setLoading(true);
    const context = articles.slice(0, 10)
      .map((a) => `- ${a.title}${a.tickers ? ` [${a.tickers}]` : ''}`)
      .join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é analista financeiro sênior. Analise as notícias e escreva exatamente 3 bullets executivos para investidores brasileiros.

Bullet 1 — Principal movimento do mercado hoje (max 20 palavras)
Bullet 2 — Ativos que merecem atenção e por quê (max 20 palavras, mencione tickers)
Bullet 3 — Evento mais importante para monitorar nos próximos dias (max 20 palavras)

Notícias:
${context}

Seja assertivo, concreto. Sem URLs.`,
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

  useEffect(() => {
    if (articles.length >= 3 && !summary && !loading) generate();
  }, [articles.length]);

  const mood = summary?.mood;
  const moodCfg = moodConfig[mood] || null;

  return (
    <div className="border border-ds-border rounded-lg overflow-hidden bg-ds-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-foreground">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/50">⬡ Resumo IA do Dia</span>
        </div>
        <div className="flex items-center gap-2">
          {mood && moodCfg && (
            <span className={`font-mono text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${moodCfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${moodCfg.dot}`} />{mood}
            </span>
          )}
          {loading && <Loader2 className="w-3 h-3 animate-spin text-white/40" />}
          {!loading && summary && (
            <button onClick={generate} className="text-white/30 hover:text-white/60 transition-colors">
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading && !summary && (
          <div className="flex items-center gap-2.5 py-2 font-sans text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-foreground/40 flex-shrink-0" />
            Analisando as principais notícias do dia...
          </div>
        )}

        {!loading && !summary && articles.length < 3 && (
          <p className="font-sans text-sm text-muted-foreground py-1">Aguardando mais notícias para gerar o resumo.</p>
        )}

        {summary?.bullets && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {summary.bullets.slice(0, 3).map((b, i) => (
              <div key={i} className="bg-ds-surface2 border border-ds-border rounded p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-semibold text-muted-foreground">{BULLET_ICONS[i]}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{BULLET_LABELS[i]}</span>
                </div>
                <p className="font-sans text-sm text-foreground leading-snug">{b}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}