import React from 'react';
import { Calendar } from 'lucide-react';

const EVENTS = [
  { day: 'Seg', event: 'IGP-M — Índice Geral de Preços', country: '🇧🇷', impact: 'alto' },
  { day: 'Ter', event: 'Balança Comercial — Exportações e Importações', country: '🇧🇷', impact: 'medio' },
  { day: 'Qua', event: 'COPOM — Ata da reunião de política monetária', country: '🇧🇷', impact: 'critico' },
  { day: 'Qui', event: 'CPI EUA — Inflação ao consumidor americana', country: '🇺🇸', impact: 'critico' },
  { day: 'Sex', event: 'Payroll — Criação de empregos nos EUA', country: '🇺🇸', impact: 'alto' },
];

const impactStyle = {
  critico: 'bg-red-500',
  alto: 'bg-amber-500',
  medio: 'bg-chart-2',
  baixo: 'bg-muted-foreground/30',
};

export default function EconomicCalendar() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60">Agenda Econômica</h3>
      </div>
      <div className="divide-y divide-border/50">
        {EVENTS.map((ev, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-[10px] font-bold text-muted-foreground w-7 flex-shrink-0">{ev.day}</span>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${impactStyle[ev.impact] || 'bg-muted'}`} />
            <p className="text-xs font-medium text-foreground/80 flex-1 leading-snug">{ev.event}</p>
            <span className="flex-shrink-0">{ev.country}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-border/50 flex items-center gap-3 text-[10px] text-muted-foreground/50">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />Crítico</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />Alto</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-chart-2 rounded-full" />Médio</span>
      </div>
    </div>
  );
}