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
    <div className="border border-white/8 rounded-xl overflow-hidden" style={{ backgroundColor: '#111110' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/6 bg-white/3">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-white/55" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/65">Resumo IA do dia</span>
        </div>
        <div className="flex items-center gap-2">
          {moodCfg && (
            <span className={`font-mono text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${moodCfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${moodCfg.dot}`} />
              {summary.mood}
            </span>
          )}
          {loading && <Loader2 className="w-3 h-3 animate-spin text-white/50" />}
          {!loading && summary && (
            <button onClick={load} className="text-white/20 hover:text-white/50 transition-colors duration-150" aria-label="Atualizar resumo">
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading && !summary && (
          <div className="flex items-center gap-2.5 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50 flex-shrink-0" />
            <span className="font-sans text-[12px] text-white/50">Analisando as principais notícias do dia…</span>
          </div>
        )}

        {!loading && !summary && (
          <p className="font-sans text-[12px] text-white/50 py-1">Aguardando mais notícias para gerar o resumo.</p>
        )}

        {summary?.bullets && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {summary.bullets.slice(0, 3).map((b, i) => (
              <div key={i} className="bg-white/3 border border-white/6 rounded-lg p-3 flex flex-col gap-2">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-white/50">{LABELS[i]}</span>
                <p className="font-sans text-[13px] text-white/65 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}