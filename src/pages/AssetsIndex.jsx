import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, ChevronRight, Coins, DollarSign, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const FEATURED_ASSETS = [
  { slug: 'petrobras', name: 'Petrobras', ticker: 'PETR4', type: 'empresa', sector: 'Energia' },
  { slug: 'vale', name: 'Vale', ticker: 'VALE3', type: 'empresa', sector: 'Mineração' },
  { slug: 'itau', name: 'Itaú Unibanco', ticker: 'ITUB4', type: 'empresa', sector: 'Financeiro' },
  { slug: 'bradesco', name: 'Bradesco', ticker: 'BBDC4', type: 'empresa', sector: 'Financeiro' },
  { slug: 'nubank', name: 'Nubank', ticker: 'NUBR33', type: 'empresa', sector: 'Fintech' },
  { slug: 'wege', name: 'WEG', ticker: 'WEGE3', type: 'empresa', sector: 'Indústria' },
  { slug: 'b3', name: 'B3', ticker: 'B3SA3', type: 'empresa', sector: 'Financeiro' },
  { slug: 'magazine-luiza', name: 'Magazine Luiza', ticker: 'MGLU3', type: 'empresa', sector: 'Varejo' },
  { slug: 'selic', name: 'Taxa Selic', ticker: null, type: 'juros', sector: 'Política Monetária' },
  { slug: 'dolar', name: 'Dólar (USD/BRL)', ticker: null, type: 'moeda', sector: 'Câmbio' },
  { slug: 'ibovespa', name: 'Ibovespa', ticker: 'IBOV', type: 'indice', sector: 'Índices' },
  { slug: 'bitcoin', name: 'Bitcoin', ticker: 'BTC', type: 'cripto', sector: 'Criptomoedas' },
  { slug: 'ethereum', name: 'Ethereum', ticker: 'ETH', type: 'cripto', sector: 'Criptomoedas' },
  { slug: 'petroleo', name: 'Petróleo (Brent)', ticker: null, type: 'commodity', sector: 'Energia' },
  { slug: 'ouro', name: 'Ouro', ticker: null, type: 'commodity', sector: 'Metais' },
  { slug: 'amazon', name: 'Amazon', ticker: 'AMZN', type: 'empresa', sector: 'Tecnologia' },
  { slug: 'apple', name: 'Apple', ticker: 'AAPL', type: 'empresa', sector: 'Tecnologia' },
  { slug: 'nvidia', name: 'Nvidia', ticker: 'NVDA', type: 'empresa', sector: 'Tecnologia' },
  { slug: 'inter', name: 'Inter', ticker: 'INBR32', type: 'empresa', sector: 'Fintech' },
  { slug: 'fed', name: 'Federal Reserve', ticker: null, type: 'juros', sector: 'Política Monetária' },
];

const typeIcons = {
  empresa: Building2,
  indice: BarChart3,
  moeda: DollarSign,
  juros: TrendingUp,
  cripto: Coins,
  commodity: TrendingUp,
};

const typeColors = {
  empresa: 'bg-primary/10 text-primary border-primary/20',
  indice: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  moeda: 'bg-accent/10 text-accent border-accent/20',
  juros: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  cripto: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  commodity: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
};

export default function AssetsIndex() {
  const grouped = {};
  FEATURED_ASSETS.forEach((a) => {
    if (!grouped[a.type]) grouped[a.type] = [];
    grouped[a.type].push(a);
  });

  const typeLabels = {
    empresa: 'Empresas',
    indice: 'Índices',
    moeda: 'Moedas',
    juros: 'Juros & Política Monetária',
    cripto: 'Criptomoedas',
    commodity: 'Commodities',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display mb-2">Páginas de Ativos</h1>
        <p className="text-muted-foreground">
          Acompanhe notícias, análises e impactos de IA para cada ativo, empresa ou indicador.
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([type, assets]) => {
          const Icon = typeIcons[type] || TrendingUp;
          return (
            <section key={type}>
              <div className="flex items-center gap-2 mb-4">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-bold">{typeLabels[type] || type}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {assets.map((asset) => {
                  const AssetIcon = typeIcons[asset.type] || TrendingUp;
                  return (
                    <Link
                      key={asset.slug}
                      to={`/ativo/${asset.slug}`}
                      className="group bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <AssetIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="font-semibold text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                        {asset.name}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {asset.ticker && (
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">{asset.ticker}</Badge>
                        )}
                        <Badge className={`text-[10px] border ${typeColors[asset.type]}`}>
                          {asset.sector}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}