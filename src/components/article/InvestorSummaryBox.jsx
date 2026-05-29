import React from 'react';
import { Zap, TrendingUp, Eye } from 'lucide-react';

export default function InvestorSummaryBox({ article }) {
  // Parse investor_summary if available, otherwise derive from article
  let bullets = [];

  if (article.investor_summary) {
    bullets = article.investor_summary.split('|').map((b) => b.trim()).filter(Boolean);
  } else {
    // Derive from existing fields
    const tickers = article.tickers ? article.tickers.split(',').slice(0, 3).map((t) => t.trim()).join(', ') : null;
    const assetsToWatch = article.assets_to_watch || tickers;

    if (article.summary) bullets.push(article.summary.split('.')[0] + '.');
    if (assetsToWatch) bullets.push(`Ativos em foco: ${assetsToWatch}`);
    if (article.relevance === 'urgente') bullets.push('Monitorar desdobramentos nas próximas horas.');
    else if (article.relevance === 'alta') bullets.push('Acompanhar nos próximos pregões.');
  }

  if (bullets.length === 0) return null;

  const icons = [Zap, TrendingUp, Eye];
  const labels = ['Impacto principal', 'Ativos afetados', 'O que observar'];
  const colors = ['text-primary', 'text-chart-2', 'text-accent'];
  const bgs = ['bg-primary/8', 'bg-chart-2/8', 'bg-accent/8'];
  const borders = ['border-primary/20', 'border-chart-2/20', 'border-accent/20'];

  return (
    <div className="my-6 rounded-xl border border-border overflow-hidden">
      <div className="bg-foreground px-4 py-2.5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-chart-2 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-widest text-background">Resumo para o Investidor</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border bg-card">
        {bullets.slice(0, 3).map((bullet, i) => {
          const Icon = icons[i];
          return (
            <div key={i} className={`p-4 ${bgs[i]} flex flex-col gap-1.5`}>
              <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${colors[i]}`}>
                <Icon className="w-3 h-3" />
                {labels[i]}
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">{bullet}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}