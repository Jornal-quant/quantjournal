import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DailySummaryBar({ articles = [] }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generateSummary = async () => {
    if (summary) { setOpen(!open); return; }
    setLoading(true);
    setOpen(true);
    const titles = articles.slice(0, 8).map((a) => `- ${a.title}`).join('\n');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista financeiro sênior. Com base nas notícias de hoje abaixo, escreva um resumo executivo do dia para investidores brasileiros em exatamente 3 bullets curtos e assertivos (máx 25 palavras cada). Não use URLs. Foco: o que importa para quem investe.\n\nNotícias:\n${titles}`,
      response_json_schema: {
        type: 'object',
        properties: {
          bullets: { type: 'array', items: { type: 'string' } },
          mood: { type: 'string', description: 'otimista, cauteloso ou pessimista' },
        },
      },
    });
    setSummary(result);
    setLoading(false);
  };

  const moodColor = {
    otimista: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    cauteloso: 'text-amber-600 bg-amber-50 border-amber-200',
    pessimista: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className="bg-primary/5 border border-primary/15 rounded-xl overflow-hidden">
      <button
        onClick={generateSummary}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/8 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Resumo IA do Dia</p>
            <p className="text-[11px] text-muted-foreground">3 pontos-chave para o investidor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          {!loading && (open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
        </div>
      </button>

      {open && summary && (
        <div className="px-4 pb-4 border-t border-primary/10">
          {summary.mood && (
            <div className="mt-3 mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${moodColor[summary.mood] || 'text-muted-foreground bg-muted border-border'}`}>
                Sentimento do dia: {summary.mood}
              </span>
            </div>
          )}
          <ul className="space-y-2 mt-3">
            {(summary.bullets || []).map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}