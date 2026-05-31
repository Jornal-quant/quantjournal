import React, { useState } from 'react';

// Cor do monograma de fallback por tipo de ativo.
const TYPE_ACCENT = {
  empresa: '#6366F1', indice: '#3B82F6', moeda: '#8B5CF6',
  juros: '#06B6D4', cripto: '#F59E0B', commodity: '#10B981',
};

const CRYPTO_ICON = { BTC: 'btc', ETH: 'eth' };
const US_DOMAINS = { NVDA: 'nvidia.com', AAPL: 'apple.com', AMZN: 'amazon.com' };

// Resolve a URL do logo a partir do ticker (sem chave): cripto via CoinCap,
// ações dos EUA via favicon, ações da B3 via icons.brapi.dev. Índices, juros,
// câmbio e commodities não têm logo de empresa -> caem no monograma.
export function logoForTicker(ticker) {
  if (!ticker) return null;
  const t = String(ticker).toUpperCase();
  if (CRYPTO_ICON[t]) return `https://assets.coincap.io/assets/icons/${CRYPTO_ICON[t]}@2x.png`;
  if (US_DOMAINS[t]) return `https://www.google.com/s2/favicons?sz=128&domain=${US_DOMAINS[t]}`;
  if (/^[A-Z]{4}\d{1,2}$/.test(t)) return `https://icons.brapi.dev/icons/${t}.svg`;
  return null;
}

export default function AssetLogo({ ticker, name, type, size = 40 }) {
  const [failed, setFailed] = useState(false);
  const url = !failed ? logoForTicker(ticker) : null;
  const accent = TYPE_ACCENT[type] || '#6B7280';
  const initials = String(ticker || name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
  const px = `${size}px`;

  return (
    <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: px, height: px }}>
      {url ? (
        <div className="w-full h-full bg-white flex items-center justify-center">
          <img
            src={url}
            alt={name || ticker || ''}
            loading="lazy"
            onError={() => setFailed(true)}
            className="w-full h-full object-contain p-1"
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)` }}>
          <span className="font-mono font-bold text-white" style={{ fontSize: Math.max(9, Math.round(size * 0.26)) }}>{initials}</span>
        </div>
      )}
    </div>
  );
}
