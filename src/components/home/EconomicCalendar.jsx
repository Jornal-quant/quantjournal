import React from 'react';

const EVENTS = [
  { day: 'Seg', event: 'IGP-M — Índice Geral de Preços',       country: '🇧🇷', impact: 'alto' },
  { day: 'Ter', event: 'Balança Comercial BR',                  country: '🇧🇷', impact: 'medio' },
  { day: 'Qua', event: 'COPOM — Ata da reunião',                country: '🇧🇷', impact: 'critico' },
  { day: 'Qui', event: 'CPI EUA — Inflação ao consumidor',      country: '🇺🇸', impact: 'critico' },
  { day: 'Sex', event: 'Payroll — Empregos nos EUA',            country: '🇺🇸', impact: 'alto' },
];

const impactColor = {
  critico: 'bg-ds-dn',
  alto:    'bg-amber-500',
  medio:   'bg-ds-up',
  baixo:   'bg-ds-border',
};

export default function EconomicCalendar() {
  return (
    <div className="border border-ds-border rounded-lg overflow-hidden bg-ds-surface">
      <div className="px-4 py-2.5 border-b border-ds-border bg-ds-surface2 flex items-center gap-2">
        <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Agenda Econômica</h3>
      </div>
      <div className="divide-y divide-ds-border">
        {EVENTS.map((ev, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span className="font-mono text-[10px] font-semibold text-muted-foreground w-7 flex-shrink-0">{ev.day}</span>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${impactColor[ev.impact] || 'bg-ds-border'}`} />
            <p className="font-sans text-xs text-foreground/80 flex-1 leading-snug">{ev.event}</p>
            <span className="text-sm flex-shrink-0">{ev.country}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-ds-border flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"><span className="w-1.5 h-1.5 bg-ds-dn rounded-full" />Crítico</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />Alto</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground"><span className="w-1.5 h-1.5 bg-ds-up rounded-full" />Médio</span>
      </div>
    </div>
  );
}