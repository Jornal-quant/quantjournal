import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const mockTickers = [
  { name: 'IBOV', value: '137.248', change: '+0.6%', up: true },
  { name: 'S&P 500', value: '5.912', change: '+0.3%', up: true },
  { name: 'USD/BRL', value: '5.68', change: '+0.4%', up: false },
  { name: 'EUR/BRL', value: '6.29', change: '+0.2%', up: true },
  { name: 'Bitcoin', value: '108.200', change: '+1.9%', up: true },
  { name: 'Ethereum', value: '2.620', change: '+2.3%', up: true },
  { name: 'Petróleo', value: '64.80', change: '-1.1%', up: false },
  { name: 'Ouro', value: '3.290', change: '+0.5%', up: true },
  { name: 'SELIC', value: '13.25%', change: '0.0%', up: null },
  { name: 'IFIX', value: '3.412', change: '+0.2%', up: true },
];

export default function TickerBar() {
  const items = [...mockTickers, ...mockTickers];

  return (
    <div className="bg-card border-b border-border overflow-hidden">
      <div className="flex animate-ticker">
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2 border-r border-border/50 whitespace-nowrap">
            <span className="text-xs font-semibold text-foreground">{t.name}</span>
            <span className="text-xs text-muted-foreground">{t.value}</span>
            <span className={`text-xs font-medium flex items-center gap-0.5 ${
              t.up === true ? 'text-chart-2' : t.up === false ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {t.up === true ? <TrendingUp className="w-3 h-3" /> : t.up === false ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}