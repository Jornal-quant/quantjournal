import React from 'react';

const EVENTS = [
  { weekday: 1, time: '09:00', label: 'IPCA-15 (IBGE)',    country: '🇧🇷', impact: 'critico' },
  { weekday: 2, time: '10:30', label: 'Balança Comercial', country: '🇧🇷', impact: 'alto' },
  { weekday: 3, time: '09:30', label: 'CPI EUA',           country: '🇺🇸', impact: 'critico' },
  { weekday: 4, time: '15:00', label: 'Fed – Ata FOMC',    country: '🇺🇸', impact: 'alto' },
  { weekday: 5, time: '09:00', label: 'Payroll EUA',       country: '🇺🇸', impact: 'critico' },
  { weekday: 5, time: '11:00', label: 'PIB Brasil',        country: '🇧🇷', impact: 'medio' },
];

const WD_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Data do dia da semana (1=Seg…5=Sex) na semana corrente, formatada dd/MM.
function dateForWeekday(weekday) {
  const now = new Date();
  const diff = weekday - now.getDay();
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const IMPACT_DOT = {
  critico: 'bg-red-400',
  alto:    'bg-orange-400',
  medio:   'bg-yellow-400',
  baixo:   'bg-foreground/20',
};

export default function EconomicCalendar() {
  return (
    <div className="border border-foreground/8 rounded-xl overflow-hidden" style={{ backgroundColor: 'hsl(var(--card))' }}>
      <div className="px-4 py-2.5 border-b border-foreground/6 bg-foreground/3 flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-foreground/60">Calendário econômico</span>
        <span className="font-mono text-[9px] text-foreground/20">referência</span>
      </div>
      <div className="divide-y divide-foreground/5">
        {EVENTS.map((e, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-foreground/3 transition-colors duration-150">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${IMPACT_DOT[e.impact]}`} />
            <span className="font-mono text-[9px] text-foreground/55 w-6 flex-shrink-0">{WD_LABEL[e.weekday]}</span>
            <span className="font-mono text-[10px] text-foreground/55 w-10 flex-shrink-0 tabular-nums">{dateForWeekday(e.weekday)}</span>
            <span className="font-mono text-[10px] text-foreground/20 w-9 flex-shrink-0 tabular-nums">{e.time}</span>
            <span className="font-sans text-[11px] text-foreground/70 flex-1 leading-tight">{e.label}</span>
            <span className="text-[11px] flex-shrink-0">{e.country}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-foreground/5 flex items-center gap-3">
        {[['critico','Crítico'],['alto','Alto'],['medio','Médio']].map(([k,l]) => (
          <div key={k} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${IMPACT_DOT[k]}`} />
            <span className="font-mono text-[9px] text-foreground/18">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}