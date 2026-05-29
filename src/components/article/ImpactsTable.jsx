import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

const ASSET_CLASSES = [
  { key: 'Bolsa', emoji: '📈', keys: ['Bolsa', 'bolsa', 'Ibovespa', 'Ações'] },
  { key: 'Dólar', emoji: '💵', keys: ['Dólar', 'dolar', 'Câmbio', 'USD'] },
  { key: 'Juros', emoji: '🏦', keys: ['Juros', 'juros', 'Selic', 'Renda Fixa', 'Taxa'] },
  { key: 'Cripto', emoji: '🪙', keys: ['Cripto', 'Criptomoedas', 'cripto', 'Bitcoin', 'BTC'] },
  { key: 'Commodities', emoji: '🛢️', keys: ['Commodities', 'commodities', 'Petróleo', 'Ouro', 'Minério'] },
];

const SENTIMENT = {
  positivo: {
    icon: TrendingUp,
    label: 'Positivo',
    textCls: 'text-emerald-600',
    bgCls: 'bg-emerald-50 border-emerald-200',
    barCls: 'bg-emerald-500',
  },
  negativo: {
    icon: TrendingDown,
    label: 'Negativo',
    textCls: 'text-red-600',
    bgCls: 'bg-red-50 border-red-200',
    barCls: 'bg-red-500',
  },
  atencao: {
    icon: AlertCircle,
    label: 'Atenção',
    textCls: 'text-amber-600',
    bgCls: 'bg-amber-50 border-amber-200',
    barCls: 'bg-amber-500',
  },
  neutro: {
    icon: Minus,
    label: 'Neutro',
    textCls: 'text-muted-foreground',
    bgCls: 'bg-muted/50 border-border',
    barCls: 'bg-muted-foreground/40',
  },
};

function detectSentiment(text) {
  if (!text) return 'neutro';
  const t = text.toLowerCase();
  if (/(positivo|alta|sobe|beneficia|favoráv|cresci|ganho|recupera|impulsa|valoriza)/i.test(t)) return 'positivo';
  if (/(negativo|queda|cai|pressiona|perda|deteriora|risco|sofre|recua|contrai)/i.test(t)) return 'negativo';
  if (/(atenção|cautela|volátil|incert|monitorar|acompanhar|pressão)/i.test(t)) return 'atencao';
  return 'neutro';
}

function findValue(impacts, asset) {
  for (const k of asset.keys) {
    if (impacts[k]) return impacts[k];
  }
  return null;
}

export default function ImpactsTable({ impacts }) {
  const available = ASSET_CLASSES.filter((a) => findValue(impacts, a));
  if (available.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {available.map((asset) => {
        const value = findValue(impacts, asset);
        const s = SENTIMENT[detectSentiment(value)];
        const Icon = s.icon;

        return (
          <div key={asset.key} className={`rounded-xl border p-4 ${s.bgCls}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{asset.emoji}</span>
                <span className="text-xs font-bold uppercase tracking-wide text-foreground/70">{asset.key}</span>
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${s.textCls}`}>
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{value}</p>
          </div>
        );
      })}
    </div>
  );
}