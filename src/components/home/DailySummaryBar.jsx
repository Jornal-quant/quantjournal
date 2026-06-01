import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Zap } from 'lucide-react';

const MOOD_CONFIG = {
  otimista:  { cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400' },
  cauteloso: { cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',    dot: 'bg-yellow-400' },
  pessimista:{ cls: 'text-red-400 bg-red-400/10 border-red-400/20',             dot: 'bg-red-400' },
};

const LABELS = ['Principal movimento', 'Ativos em atenção', 'Monitorar'];

const CACHE_KEY = 'daily-summary';
const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.day === todayKey() ? parsed.summary : null;
  } catch {
    return null;
  }
}

export default function DailySummaryBar() {
  const [summary, setSummary] = useState(() => loadCache());
  const [loading, setLoading] = useState(!loadCache());

  // Lê o resumo já gerado pelo servidor (cron). Barato, sem IA no navegador.
  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getDailySummary', {});
      const data = (res?.data || res)?.summary;
      if (data?.bullets?.length) {
        setSummary(data);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ day: todayKey(), summary: data })); } catch { /* ignore */ }
      }
    } catch { /* mantém o cache, se houver */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!summary) load();
  }, []);

  const moodCfg = MOOD_CONFIG[summary?.mood] || null;

  return (
    <section className="border border-foreground/15 rounded-md overflow-hidden bg-[hsl(var(--card))]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/15 bg-secondary/40">
        <div className="flex items-center gap-2.5">
          <Zap className="w-3.5 h-3.5 text-[var(--title-accent)]" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--title-accent)]">Resumo IA do dia</span>
        </div>
        <div className="flex items-center gap-2">
          {moodCfg && (
            <span className={`font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${moodCfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${moodCfg.dot}`} />
              {summary.mood}
            </span>
          )}
          {loading && <Loader2 className="w-3 h-3 animate-spin text-foreground/50" />}
          {!loading && summary && (
            <button onClick={load} className="text-foreground/45 hover:text-foreground transition-colors duration-150" aria-label="Atualizar resumo">
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {loading && !summary && (
          <div className="flex items-center justify-between gap-4 border-l-2 border-[var(--title-accent)] pl-3">
            <div>
              <p className="font-mono text-[13px] font-semibold text-foreground">Preparando leitura do mercado</p>
              <p className="font-sans text-[13px] text-foreground/65 leading-relaxed">A IA está cruzando as notícias mais recentes antes de publicar o resumo.</p>
            </div>
            <Loader2 className="w-4 h-4 animate-spin text-[var(--title-accent)] flex-shrink-0" />
          </div>
        )}

        {!loading && !summary && (
          <div className="flex items-center justify-between gap-4 border-l-2 border-foreground/20 pl-3">
            <div>
              <p className="font-mono text-[13px] font-semibold text-foreground">Resumo ainda não disponível</p>
              <p className="font-sans text-[13px] text-foreground/65 leading-relaxed">Aguardando volume suficiente de notícias relevantes para gerar uma leitura do dia.</p>
            </div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/55 border border-foreground/15 px-2.5 py-1 rounded-sm whitespace-nowrap">
              Aguardando
            </span>
          </div>
        )}

        {summary?.bullets && (
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-foreground/12">
            {summary.bullets.slice(0, 3).map((b, i) => (
              <div key={i} className="py-1 sm:px-4 first:pl-0 last:pr-0 flex flex-col gap-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--title-accent)]">{LABELS[i]}</span>
                <p className="font-sans text-[14px] text-foreground/78 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
