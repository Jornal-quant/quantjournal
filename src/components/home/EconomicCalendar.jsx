import React from 'react';

const EVENTS = [
  { date: 'Seg', time: '09:00', label: 'IPCA-15 (IBGE)',   country: '🇧🇷', impact: 'critico' },
  { date: 'Ter', time: '10:30', label: 'Balança Comercial', country: '🇧🇷', impact: 'alto' },
  { date: 'Qua', time: '09:30', label: 'CPI EUA',           country: '🇺🇸', impact: 'critico' },
  { date: 'Qui', time: '15:00', label: 'Fed – Ata FOMC',    country: '🇺🇸', impact: 'alto' },
  { date: 'Sex', time: '09:00', label: 'Payroll EUA',       country: '🇺🇸', impact: 'critico' },
  { date: 'Sex', time: '11:00', label: 'PIB Brasil T1',     country: '🇧🇷', impact: 'medio' },
];

const IMPACT_DOT = {
  critico: 'bg-red-400',
  alto:    'bg-orange-400',
  medio:   'bg-yellow-400',
  baixo:   'bg-white/20',
};

export default function EconomicCalendar() {
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden" style={{ backgroundColor: '#111110' }}>
      <div className="px-4 py-2.5 border-b border-white/6 bg-white/3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/35">Calendário econômico</span>
      </div>
      <div className="divide-y divide-white/5">
        {EVENTS.map((e, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/3 transition-colors duration-150">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${IMPACT_DOT[e.impact]}`} />
            <span className="font-mono text-[9px] text-white/20 w-6 flex-shrink-0">{e.date}</span>
            <span className="font-mono text-[10px] text-white/20 w-10 flex-shrink-0 tabular-nums">{e.time}</span>
            <span className="font-sans text-[11px] text-white/45 flex-1 leading-tight">{e.label}</span>
            <span className="text-[11px] flex-shrink-0">{e.country}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-white/5 flex items-center gap-3">
        {[['critico','Crítico'],['alto','Alto'],['medio','Médio']].map(([k,l]) => (
          <div key={k} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${IMPACT_DOT[k]}`} />
            <span className="font-mono text-[9px] text-white/18">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}