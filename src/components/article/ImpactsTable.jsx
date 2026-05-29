import React from 'react';

const ASSET_CLASSES = [
  { key: 'Bolsa', label: 'Bolsa', emoji: '📈' },
  { key: 'Dólar', label: 'Dólar', emoji: '💵' },
  { key: 'Juros', label: 'Juros', emoji: '🏦' },
  { key: 'Criptomoedas', label: 'Criptomoedas', emoji: '🪙' },
  { key: 'Commodities', label: 'Commodities', emoji: '🛢️' },
];

const IMPACT_MAP = {
  positivo: { icon: '🟢', label: 'Positivo', cls: 'text-chart-2 bg-chart-2/5' },
  negativo: { icon: '🔴', label: 'Negativo', cls: 'text-destructive bg-destructive/5' },
  neutro: { icon: '🟡', label: 'Neutro', cls: 'text-accent bg-accent/5' },
};

function detectSentiment(text) {
  if (!text) return 'neutro';
  const lower = text.toLowerCase();
  if (/(positivo|alta|sobe|beneficia|favoráv|cresci|ganho|recupera)/i.test(lower)) return 'positivo';
  if (/(negativo|queda|cai|pressiona|impacto neg|perda|deteriora|risco)/i.test(lower)) return 'negativo';
  return 'neutro';
}

export default function ImpactsTable({ impacts }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-left p-3 font-semibold text-muted-foreground w-32">Classe</th>
            <th className="text-left p-3 font-semibold text-muted-foreground w-28">Impacto</th>
            <th className="text-left p-3 font-semibold text-muted-foreground">Explicação</th>
          </tr>
        </thead>
        <tbody>
          {ASSET_CLASSES.map((asset, i) => {
            // Try to find the value with different key formats
            const value =
              impacts[asset.key] ||
              impacts[asset.key.toLowerCase()] ||
              impacts[asset.label] ||
              null;

            const sentiment = detectSentiment(value);
            const impact = IMPACT_MAP[sentiment];

            return (
              <tr key={asset.key} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                <td className="p-3 font-medium">
                  <span className="mr-1.5">{asset.emoji}</span>
                  {asset.label}
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${impact.cls}`}>
                    {impact.icon} {impact.label}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground leading-relaxed">
                  {value || <span className="italic text-muted-foreground/50">Sem dados</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}