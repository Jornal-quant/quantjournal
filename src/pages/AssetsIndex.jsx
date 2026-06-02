import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import AssetLogo from '../components/AssetLogo';

const ASSETS = [
  // Empresas BR
  { slug: 'petrobras',      name: 'Petrobras',         ticker: 'PETR4',   type: 'empresa',   sector: 'Energia',          country: '🇧🇷' },
  { slug: 'vale',           name: 'Vale',              ticker: 'VALE3',   type: 'empresa',   sector: 'Mineração',        country: '🇧🇷' },
  { slug: 'itau',           name: 'Itaú Unibanco',     ticker: 'ITUB4',   type: 'empresa',   sector: 'Financeiro',       country: '🇧🇷' },
  { slug: 'bradesco',       name: 'Bradesco',          ticker: 'BBDC4',   type: 'empresa',   sector: 'Financeiro',       country: '🇧🇷' },
  { slug: 'nubank',         name: 'Nubank',            ticker: 'NUBR33',  type: 'empresa',   sector: 'Fintech',          country: '🇧🇷' },
  { slug: 'wege',           name: 'WEG',               ticker: 'WEGE3',   type: 'empresa',   sector: 'Industrial',       country: '🇧🇷' },
  { slug: 'b3',             name: 'B3',                ticker: 'B3SA3',   type: 'empresa',   sector: 'Financeiro',       country: '🇧🇷' },
  { slug: 'magazine-luiza', name: 'Magazine Luiza',    ticker: 'MGLU3',   type: 'empresa',   sector: 'Varejo',           country: '🇧🇷' },
  { slug: 'inter',          name: 'Banco Inter',       ticker: 'INBR32',  type: 'empresa',   sector: 'Fintech',          country: '🇧🇷' },
  // Empresas INT
  { slug: 'nvidia',         name: 'Nvidia',            ticker: 'NVDA',    type: 'empresa',   sector: 'Tecnologia',       country: '🇺🇸' },
  { slug: 'apple',          name: 'Apple',             ticker: 'AAPL',    type: 'empresa',   sector: 'Tecnologia',       country: '🇺🇸' },
  { slug: 'amazon',         name: 'Amazon',            ticker: 'AMZN',    type: 'empresa',   sector: 'Tecnologia',       country: '🇺🇸' },
  // Índices
  { slug: 'ibovespa',       name: 'Ibovespa',          ticker: 'IBOV',    type: 'indice',    sector: 'Índice BR',        country: '🇧🇷' },
  { slug: 'sp500',          name: 'S&P 500',           ticker: 'SPX',     type: 'indice',    sector: 'Índice EUA',       country: '🇺🇸' },
  // Moedas
  { slug: 'dolar',          name: 'Dólar (USD/BRL)',   ticker: 'USD/BRL', type: 'moeda',     sector: 'Câmbio',           country: '🌐' },
  { slug: 'euro',           name: 'Euro (EUR/BRL)',    ticker: 'EUR/BRL', type: 'moeda',     sector: 'Câmbio',           country: '🌐' },
  // Juros
  { slug: 'selic',          name: 'Taxa Selic',        ticker: 'SELIC',   type: 'juros',     sector: 'Política Monetária', country: '🇧🇷' },
  // Cripto
  { slug: 'bitcoin',        name: 'Bitcoin',           ticker: 'BTC',     type: 'cripto',    sector: 'Criptomoedas',     country: '🌐' },
  { slug: 'ethereum',       name: 'Ethereum',          ticker: 'ETH',     type: 'cripto',    sector: 'Criptomoedas',     country: '🌐' },
  // Commodities
  { slug: 'petroleo',       name: 'Petróleo (WTI)',    ticker: 'OIL',     type: 'commodity', sector: 'Energia',          country: '🌐' },
  { slug: 'ouro',           name: 'Ouro',              ticker: 'GOLD',    type: 'commodity', sector: 'Metais',           country: '🌐' },
];

const TYPE_LABELS = {
  empresa: 'Empresas', indice: 'Índices', moeda: 'Moedas e Câmbio',
  juros: 'Juros & Bancos Centrais', cripto: 'Criptomoedas', commodity: 'Commodities',
};

const TYPE_ORDER = ['empresa', 'indice', 'juros', 'moeda', 'cripto', 'commodity'];

export default function AssetsIndex() {
  const [query, setQuery] = useState('');

  const filtered = query
    ? ASSETS.filter((a) =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.ticker?.toLowerCase().includes(query.toLowerCase()) ||
        a.sector.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  const grouped = {};
  (filtered || ASSETS).forEach((a) => {
    if (!grouped[a.type]) grouped[a.type] = [];
    grouped[a.type].push(a);
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Cobertura</p>
        <h1 className="font-mono text-2xl font-semibold mb-2">Ativos monitorados</h1>
        <p className="font-sans text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Acompanhe notícias, análises de IA e sentimento de mercado para empresas, índices, moedas, juros e commodities. Clique em um ativo para ver a análise completa.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ativo ou ticker..."
          className="w-full font-mono text-sm pl-9 pr-4 py-2.5 bg-ds-surface border border-ds-border rounded outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Results */}
      {filtered && filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="font-mono text-sm text-muted-foreground">Nenhum ativo encontrado para "{query}"</p>
          <button onClick={() => setQuery('')} className="font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors underline">
            Limpar busca
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {TYPE_ORDER.filter((t) => grouped[t]).map((type) => (
            <section key={type}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-0.5 h-4 bg-foreground/20 rounded-full" />
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{TYPE_LABELS[type]}</h2>
                <span className="font-mono text-[9px] text-muted-foreground/40">{grouped[type].length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {grouped[type].map((asset) => (
                  <Link key={asset.slug} to={`/ativo/${asset.slug}`}
                    className="group flex items-center justify-between bg-ds-surface border border-ds-border rounded-lg px-4 py-3.5 hover:border-foreground/20 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <AssetLogo ticker={asset.ticker} name={asset.name} type={asset.type} size={36} />
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold leading-none truncate group-hover:text-ds-beige transition-colors">{asset.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          {asset.ticker && <span className="font-mono text-[10px] text-muted-foreground">{asset.ticker}</span>}
                          <span className="text-sm">{asset.country}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground flex-shrink-0 ml-2 transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-12 pt-6 border-t border-ds-border">
        <p className="font-sans text-[11px] text-muted-foreground/50 leading-relaxed text-center max-w-3xl mx-auto">
          As análises e informações exibidas são geradas por inteligência artificial com base em fontes públicas. Não constituem recomendação de investimento.
          Preços e variações podem estar desatualizados. Consulte fontes oficiais antes de tomar decisões financeiras.
        </p>
      </div>
    </div>
  );
}