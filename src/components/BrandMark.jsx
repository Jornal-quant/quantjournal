import React from 'react';

// Marca "CT" do Capital Times, recriada em SVG (vetor → nítida em qualquer
// tamanho). Adapta ao tema: os quadrados usam currentColor (cor do texto, ou
// seja, foreground) e as letras usam a cor de fundo da página, então no modo
// escuro os quadrados ficam claros automaticamente. Aplique a cor via classe
// (ex.: text-foreground).
export default function BrandMark({ className = 'h-6 w-auto' }) {
  return (
    <svg viewBox="0 0 48 40" className={className} role="img" aria-label="Capital Times">
      <rect x="0" y="0" width="22" height="34" rx="3" fill="currentColor" />
      <rect x="26" y="0" width="22" height="34" rx="3" fill="currentColor" />
      <text x="11" y="25.5" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="800" fontSize="24" fill="hsl(var(--background))">C</text>
      <text x="37" y="25.5" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="800" fontSize="24" fill="hsl(var(--background))">T</text>
      <rect x="14" y="37" width="20" height="2.6" rx="1.3" fill="var(--title-accent)" />
    </svg>
  );
}
