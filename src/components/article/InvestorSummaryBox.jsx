import React from 'react';

export default function InvestorSummaryBox({ article }) {
  let bullets = [];

  if (article.investor_summary) {
    bullets = article.investor_summary.split('|').map((b) => b.trim()).filter(Boolean);
  } else {
    const tickers = article.tickers ? article.tickers.split(',').slice(0, 3).map((t) => t.trim()).join(', ') : null;
    const assetsWatch = article.assets_to_watch || tickers;
    if (article.summary) bullets.push(article.summary.split('.')[0] + '.');
    if (assetsWatch) bullets.push(`Ativos em monitoramento: ${assetsWatch}`);
    if (article.relevance === 'urgente') bullets.push('Situação em desenvolvimento — acompanhar desdobramentos nas próximas horas.');
    else if (article.relevance === 'alta') bullets.push('Impacto pode se consolidar nos próximos pregões — investidores acompanham.');
    else if (article.conclusion) bullets.push(article.conclusion.split('.')[0] + '.');
  }

  if (bullets.length === 0) return null;

  const SLOTS = [
    { label: 'Impacto identificado' },
    { label: 'Ativos em atenção' },
    { label: 'O que monitorar' },
  ];

  return (
    <div className="my-6 border border-ds-border rounded-lg overflow-hidden">
      <div className="bg-foreground px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-ds-up animate-pulse" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/60">Resumo para o investidor</span>
        </div>
        <span className="font-mono text-[9px] text-white/25">⬡ Gerado por IA</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ds-border bg-ds-surface2">
        {bullets.slice(0, 3).map((bullet, i) => (
          <div key={i} className="p-4">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {SLOTS[i]?.label || `Ponto ${i + 1}`}
            </p>
            <p className="font-sans text-sm text-foreground/80 leading-relaxed">{bullet}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-ds-border bg-ds-surface2">
        <p className="font-sans text-[10px] text-muted-foreground/50">
          ⚠️ Resumo informativo gerado por IA. Não constitui recomendação de investimento.
        </p>
      </div>
    </div>
  );
}