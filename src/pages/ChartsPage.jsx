import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { triggerQuotesRefresh } from '@/lib/market';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Sparkles, Loader2, 
  Scale, X, Layers, LineChart as ChartIcon
} from 'lucide-react';
import { formatMarketPrice, formatChangePercent } from '@/lib/utils';
import AssetLogo from '../components/AssetLogo';
import ReactMarkdown from 'react-markdown';

const ASSETS = [
  // Índices
  { slug: 'ibovespa',       name: 'Ibovespa',          ticker: 'IBOV',    type: 'indice',    sector: 'Índice BR',        country: '🇧🇷' },
  { slug: 'sp500',          name: 'S&P 500',           ticker: 'SPX',     type: 'indice',    sector: 'Índice EUA',       country: '🇺🇸' },
  // Moedas
  { slug: 'dolar',          name: 'Dólar (USD/BRL)',   ticker: 'USD/BRL', type: 'moeda',     sector: 'Câmbio',           country: '🌐' },
  { slug: 'euro',           name: 'Euro (EUR/BRL)',    ticker: 'EUR/BRL', type: 'moeda',     sector: 'Câmbio',           country: '🌐' },
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
  // Juros
  { slug: 'selic',          name: 'Taxa Selic',        ticker: 'SELIC',   type: 'juros',     sector: 'Política Monetária', country: '🇧🇷' },
  { slug: 'fed',            name: 'Federal Reserve',   ticker: 'FED',     type: 'juros',     sector: 'Política Monetária', country: '🇺🇸' },
  // Cripto
  { slug: 'bitcoin',        name: 'Bitcoin',           ticker: 'BTC',     type: 'cripto',    sector: 'Criptomoedas',     country: '🌐' },
  { slug: 'ethereum',       name: 'Ethereum',          ticker: 'ETH',     type: 'cripto',    sector: 'Criptomoedas',     country: '🌐' },
  // Commodities
  { slug: 'petroleo',       name: 'Petróleo (Brent)',  ticker: 'BRENT',   type: 'commodity', sector: 'Energia',          country: '🌐' },
  { slug: 'ouro',           name: 'Ouro',              ticker: 'GOLD',    type: 'commodity', sector: 'Metais',           country: '🌐' },
];

const CATEGORIES = [
  { key: 'indice', label: 'Índices' },
  { key: 'empresa', label: 'Ações/Empresas' },
  { key: 'moeda', label: 'Câmbio/Moedas' },
  { key: 'cripto', label: 'Cripto' },
  { key: 'commodity', label: 'Commodities' },
  { key: 'juros', label: 'Juros e Taxas' },
];

const RANGES = [
  { key: '1mo', label: '1 Mês' },
  { key: '3mo', label: '3 Meses' },
  { key: '1y', label: '1 Ano' },
];

// Calcula Média Móvel Simples (SMA) de forma segura
function calculateSMA(series, period) {
  if (!Array.isArray(series) || series.length < period) return [];
  const result = [];
  for (let i = 0; i < series.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += (series[i - j]?.close || 0);
      }
      result.push(parseFloat((sum / period).toFixed(4)));
    }
  }
  return result;
}

export default function ChartsPage() {
  const [selectedCat, setSelectedCat] = useState('indice');
  const [primaryAsset, setPrimaryAsset] = useState(ASSETS[0]); // Default Ibovespa
  const [compareAsset, setCompareAsset] = useState(null);
  const [range, setRange] = useState('3mo');

  // Indicadores técnicos
  const [showSma20, setShowSma20] = useState(false);
  const [showSma50, setShowSma50] = useState(false);

  // Análise da IA
  const [aiReport, setAiReport] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Cotações ao vivo do sistema
  const { data: snapshots = [] } = useQuery({
    queryKey: ['snapshots-charts'],
    queryFn: () => {
      triggerQuotesRefresh(); // mantém as cotações frescas enquanto há visitantes
      return base44.entities.MarketSnapshot.list();
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // atualizar a cada 60s
    refetchOnWindowFocus: true,
  });

  // Query do ativo principal
  const { data: primaryData, isLoading: loadingPrimary } = useQuery({
    queryKey: ['charts-history-primary', primaryAsset.ticker, range],
    queryFn: () => base44.functions.invoke('assetHistory', { ticker: primaryAsset.ticker, range }),
    enabled: !!primaryAsset.ticker,
    staleTime: 5 * 60 * 1000,
  });

  // Query do ativo de comparação
  const { data: compareData, isLoading: loadingCompare } = useQuery({
    queryKey: ['charts-history-compare', compareAsset?.ticker, range],
    queryFn: () => base44.functions.invoke('assetHistory', { ticker: compareAsset.ticker, range }),
    enabled: !!compareAsset?.ticker,
    staleTime: 5 * 60 * 1000,
  });

  // Encontra snapshots de cotação atuais de forma segura
  const primarySnapshot = useMemo(() => {
    return Array.isArray(snapshots) ? snapshots.find(s => s.symbol?.toUpperCase() === primaryAsset.ticker?.toUpperCase()) : null;
  }, [snapshots, primaryAsset]);

  const compareSnapshot = useMemo(() => {
    return compareAsset && Array.isArray(snapshots) ? snapshots.find(s => s.symbol?.toUpperCase() === compareAsset.ticker?.toUpperCase()) : null;
  }, [snapshots, compareAsset]);

  // Lista filtrada de ativos por categoria
  const filteredAssets = useMemo(() => {
    return ASSETS.filter(a => a.type === selectedCat);
  }, [selectedCat]);

  // Processamento e Alinhamento de dados históricos de forma ultra-segura
  const chartData = useMemo(() => {
    const pSeries = Array.isArray(primaryData?.data?.series) ? primaryData.data.series : [];
    const cSeries = compareAsset && Array.isArray(compareData?.data?.series) ? compareData.data.series : [];

    if (pSeries.length === 0) return [];

    // Se NÃO há ativo de comparação, retorna dados absolutos com SMA calculada
    if (!compareAsset || cSeries.length === 0) {
      const sma20 = calculateSMA(pSeries, 20);
      const sma50 = calculateSMA(pSeries, 50);

      return pSeries.map((d, i) => {
        const item = {
          date: d.date,
          close: d.close,
        };
        if (showSma20 && sma20[i] !== null && sma20[i] !== undefined) item.sma20 = sma20[i];
        if (showSma50 && sma50[i] !== null && sma50[i] !== undefined) item.sma50 = sma50[i];
        return item;
      });
    }

    // Se HÁ ativo de comparação, alinha as séries por data e plota variação percentual (Base 100)
    const baseP = pSeries[0]?.close || 1;
    const baseC = cSeries[0]?.close || 1;

    // Indexa série de comparação por data para busca rápida
    const cMap = {};
    cSeries.forEach(item => {
      const day = String(item.date).slice(0, 10);
      cMap[day] = item.close;
    });

    return pSeries.map(pItem => {
      const day = String(pItem.date).slice(0, 10);
      const pVal = pItem.close;
      const cVal = cMap[day];

      const pPct = ((pVal - baseP) / baseP) * 100;
      const cPct = cVal !== undefined ? ((cVal - baseC) / baseC) * 100 : null;

      return {
        date: pItem.date,
        pClose: pVal,
        pPct: parseFloat(pPct.toFixed(2)),
        cClose: cVal,
        cPct: cPct !== null ? parseFloat(cPct.toFixed(2)) : null,
      };
    });
  }, [primaryData, compareData, compareAsset, showSma20, showSma50]);

  // Variação total no período
  const periodStats = useMemo(() => {
    const series = Array.isArray(primaryData?.data?.series) ? primaryData.data.series : [];
    if (series.length < 2) return null;
    const first = series[0]?.close;
    const last = series[series.length - 1]?.close;
    if (first === undefined || last === undefined) return null;
    const diff = last - first;
    const pct = first !== 0 ? (diff / first) * 100 : 0;
    return { first, last, diff, pct, up: pct >= 0 };
  }, [primaryData]);

  // Formatação segura (nunca retorna undefined/null/NaN)
  const fmtPrice = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('pt-BR', { maximumFractionDigits: n >= 1000 ? 0 : 2 });
  };
  
  const fmtDate = (d) => {
    if (!d) return '';
    const p = String(d).slice(0, 10).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}` : String(d);
  };

  const handleSelectPrimary = (asset) => {
    if (compareAsset && compareAsset.slug === asset.slug) {
      setCompareAsset(null);
    }
    setPrimaryAsset(asset);
    setAiReport(null); // Reseta relatório de IA antigo
  };

  const handleToggleCompare = (asset) => {
    if (primaryAsset.slug === asset.slug) return;
    if (compareAsset?.slug === asset.slug) {
      setCompareAsset(null);
    } else {
      setCompareAsset(asset);
    }
  };

  const handleGenerateAIReport = async () => {
    if (loadingAI) return;
    setLoadingAI(true);

    const pricePoints = chartData.slice(-10).map(d => {
      if (compareAsset) {
        return `- ${fmtDate(d.date)}: ${primaryAsset.name} ${d.pPct}% | ${compareAsset.name} ${d.cPct}%`;
      }
      return `- ${fmtDate(d.date)}: ${fmtPrice(d.close)}`;
    }).join('\n');

    const promptText = `Você é um analista financeiro sênior técnico da plataforma Capital Times.
Analise a performance técnica recente do ativo principal: ${primaryAsset.name} (${primaryAsset.ticker}) no período de ${range}.

${compareAsset ? `Há um ativo de comparação adicionado: ${compareAsset.name} (${compareAsset.ticker}). Compare o desempenho relativo deles.` : ''}

Últimos pontos do gráfico para referência:
${pricePoints}

Gere um relatório técnico contendo:
1. **Visão Geral do Movimento**: Identifique a tendência principal do período (alta, baixa, consolidação).
2. **Níveis de Suporte e Resistência Estimados**: Estime faixas de preço de suporte e resistência baseado nos dados.
3. **Análise de Correlação/Performance**: ${compareAsset ? 'Comente sobre a correlação recente e quem está liderando.' : 'Comente sobre a volatilidade e força da tendência.'}
4. **Perspectiva de Curto Prazo**: Uma visão analítica e sóbria sobre o que esperar nos próximos dias.

REGRAS CRÍTICAS:
- NUNCA use linguagem de recomendação financeira ("compre", "venda", "garantido"). Use termos adequados ("indica pressão vendedora", "encontra suporte", "sugere cautela").
- Seja direto, técnico e conciso (máx. 300 palavras). Use Markdown para estruturar com elegância.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: promptText,
        add_context_from_internet: true,
      });
      setAiReport(response);
    } catch (e) {
      setAiReport('Ocorreu um erro ao gerar a análise técnica da IA. Por favor, tente novamente.');
    } finally {
      setLoadingAI(false);
    }
  };

  const hasData = chartData.length > 0;
  const isUp = periodStats?.up;
  const color = isUp ? '#34D399' : '#F87171'; // emerald-400 : red-400

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Hub de Cotações</p>
          <h1 className="font-mono text-2xl font-semibold flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-[var(--title-accent)]" /> Painel Gráfico Interativo
          </h1>
          <p className="font-sans text-sm text-muted-foreground mt-1 max-w-xl">
            Acompanhe o histórico de ativos globais, plote médias móveis e compare a performance percentual acumulada.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex bg-ds-surface border border-ds-border rounded p-1 self-start md:self-auto">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`font-mono text-[11px] font-semibold px-4 py-2 rounded transition-colors ${
                range === r.key 
                  ? 'bg-foreground text-background shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Chart area (Left) + Asset Selectors (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Chart Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          <div className="border border-ds-border rounded-lg bg-ds-surface overflow-hidden">
            {/* Chart Header */}
            <div className="p-4 md:p-6 border-b border-ds-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ds-surface2">
              <div className="flex items-center gap-3.5">
                <AssetLogo ticker={primaryAsset.ticker} name={primaryAsset.name} type={primaryAsset.type} size={48} />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-mono text-lg font-semibold leading-tight">{primaryAsset.name}</h2>
                    <span className="font-mono text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded-sm">{primaryAsset.ticker}</span>
                    {compareAsset && (
                      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground border-l border-ds-border pl-2">
                        <span>vs</span>
                        <AssetLogo ticker={compareAsset.ticker} name={compareAsset.name} type={compareAsset.type} size={20} />
                        <span className="text-foreground">{compareAsset.name}</span>
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1 rounded-sm text-[9px] font-bold">COMPARAÇÃO</span>
                        <button 
                          onClick={() => setCompareAsset(null)}
                          className="p-0.5 hover:text-foreground transition-colors rounded-full hover:bg-ds-surface"
                          title="Remover Comparação"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {primarySnapshot && (
                      <>
                        <span className="font-mono text-sm font-semibold">{formatMarketPrice(primarySnapshot)}</span>
                        <span className={`font-mono text-xs flex items-center gap-0.5 font-medium ${
                          primarySnapshot.change_percent >= 0 ? 'text-ds-up' : 'text-ds-dn'
                        }`}>
                          {primarySnapshot.change_percent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {formatChangePercent(primarySnapshot.change_percent)}
                        </span>
                      </>
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono">
                      · {range === '1mo' ? '1 Mês' : range === '3mo' ? '3 Meses' : '1 Ano'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Indicator Toggles (Only when not in comparison mode) */}
              {!compareAsset && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Médias Móveis:
                  </span>
                  <button
                    onClick={() => setShowSma20(!showSma20)}
                    className={`font-mono text-[10px] font-medium px-2.5 py-1.5 rounded border transition-all ${
                      showSma20 
                        ? 'border-indigo-500/55 bg-indigo-500/10 text-indigo-400' 
                        : 'border-ds-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    SMA 20
                  </button>
                  <button
                    onClick={() => setShowSma50(!showSma50)}
                    className={`font-mono text-[10px] font-medium px-2.5 py-1.5 rounded border transition-all ${
                      showSma50 
                        ? 'border-amber-500/55 bg-amber-500/10 text-amber-400' 
                        : 'border-ds-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    SMA 50
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Recharts Chart Canvas */}
            <div className="p-4 md:p-6">
              {loadingPrimary || (compareAsset && loadingCompare) ? (
                <div className="h-72 w-full flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  <p className="font-mono text-xs text-muted-foreground">Carregando cotações históricas...</p>
                </div>
              ) : hasData ? (
                <>
                  {/* Performance stats bar */}
                  {periodStats && (
                    <div className="flex items-center justify-between mb-4 bg-ds-surface2 px-4 py-2.5 rounded border border-ds-border">
                      <div className="font-mono text-[11px] text-muted-foreground">
                        Variação total no período ({range === '1mo' ? '1M' : range === '3mo' ? '3M' : '1A'}):
                      </div>
                      <div className={`font-mono text-[12px] font-bold flex items-center gap-1 ${
                        isUp ? 'text-ds-up' : 'text-ds-dn'
                      }`}>
                        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {isUp ? '+' : ''}{periodStats.pct.toFixed(2)}%
                        <span className="font-mono font-medium text-muted-foreground text-[10px] ml-1.5">
                          ({isUp ? '+' : ''}{fmtPrice(periodStats.diff)} pts)
                        </span>
                      </div>
                    </div>
                  )}

                  {compareAsset ? (
                    // COMPARISON CHART: Plot relative variation (%) in a dedicated ResponsiveContainer
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={fmtDate} 
                          minTickGap={45} 
                          tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <Tooltip
                          contentStyle={{ background: '#111110', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}
                          labelFormatter={(d) => d ? String(d).slice(0, 10).split('-').reverse().join('/') : ''}
                          formatter={(value, name, props) => {
                            const isP = name === primaryAsset.name;
                            const abs = isP ? props?.payload?.pClose : props?.payload?.cClose;
                            return [
                              <span className="font-mono">
                                <strong>{value}%</strong> <span className="text-muted-foreground text-[11px]">({fmtPrice(abs)})</span>
                              </span>,
                              name
                            ];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace', marginTop: 10 }} />
                        <Line 
                          type="monotone" 
                          dataKey="pPct" 
                          name={primaryAsset.name} 
                          stroke="#34D399" 
                          strokeWidth={2.5} 
                          dot={false} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="cPct" 
                          name={compareAsset.name} 
                          stroke="#60A5FA" 
                          strokeWidth={2.5} 
                          dot={false} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    // ABSOLUTE SINGLE CHART: Area chart with optional SMA overlays in a dedicated ResponsiveContainer
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={fmtDate} 
                          minTickGap={45} 
                          tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          tickFormatter={fmtPrice} 
                          tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <Tooltip
                          contentStyle={{ background: '#111110', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}
                          labelFormatter={(d) => d ? String(d).slice(0, 10).split('-').reverse().join('/') : ''}
                          formatter={(v, name) => {
                            if (name === 'sma20') return [fmtPrice(v), 'Média Móvel (20)'];
                            if (name === 'sma50') return [fmtPrice(v), 'Média Móvel (50)'];
                            return [fmtPrice(v), 'Fechamento'];
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="close" 
                          stroke={color} 
                          strokeWidth={2} 
                          fill="url(#primaryAreaGrad)" 
                        />
                        {showSma20 && (
                          <Line 
                            type="monotone" 
                            dataKey="sma20" 
                            stroke="#818CF8" // indigo-400
                            strokeWidth={1.5} 
                            dot={false} 
                            strokeDasharray="4 4"
                          />
                        )}
                        {showSma50 && (
                          <Line 
                            type="monotone" 
                            dataKey="sma50" 
                            stroke="#FBBF24" // amber-400
                            strokeWidth={1.5} 
                            dot={false} 
                            strokeDasharray="3 3"
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </>
              ) : (
                <div className="h-72 flex items-center justify-center text-center">
                  <p className="font-mono text-xs text-muted-foreground">Histórico de cotações indisponível para {primaryAsset.ticker}.</p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="px-4 py-3 border-t border-ds-border bg-ds-surface2 flex items-center justify-between">
              <span className="font-mono text-[9px] text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Quotes
              </span>
              <span className="font-mono text-[9px] text-muted-foreground/60">
                Preços de fechamento baseados na API do Neon/Base44
              </span>
            </div>
          </div>

          {/* AI Technical Analysis Report */}
          <div className="border border-ds-border rounded-lg overflow-hidden bg-ds-surface shadow-sm">
            <div className="px-4 py-3.5 border-b border-ds-border bg-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-background animate-pulse" />
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-background">
                  Análise Técnica por IA · {primaryAsset.name}
                </h3>
              </div>
              <button 
                onClick={handleGenerateAIReport}
                disabled={loadingAI}
                className="font-mono text-[10px] font-bold bg-background text-foreground hover:bg-background/90 transition-colors border border-foreground/15 px-3 py-1.5 rounded flex items-center gap-1.5 disabled:opacity-40"
              >
                {loadingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando Gráfico...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Analisar Gráfico
                  </>
                )}
              </button>
            </div>

            <div className="p-5">
              {aiReport ? (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown 
                    className="font-sans text-sm leading-relaxed text-foreground/85 space-y-3 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>h3]:font-mono [&>h3]:text-[12px] [&>h3]:font-bold [&>h3]:uppercase [&>h3]:tracking-wider [&>h3]:text-[var(--title-accent)] [&>h3]:mt-4"
                  >
                    {typeof aiReport === 'string' ? aiReport : JSON.stringify(aiReport)}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="font-mono text-xs text-muted-foreground">
                    Clique no botão acima para ter uma análise técnica completa gerada por inteligência artificial, decodificando suportes, resistências e cenários de curto prazo.
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-ds-border bg-ds-surface2">
              <p className="font-sans text-[10px] text-muted-foreground">
                ⚠️ Aviso Legal: Análise informativa gerada por IA. Não constitui recomendação de investimento sob nenhuma circunstância.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Category & Asset Selection List */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Asset Class Categories */}
          <div className="border border-ds-border rounded-lg bg-ds-surface p-4">
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Classe de Ativos</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCat(cat.key)}
                  className={`font-mono text-[11px] font-semibold px-3 py-2 rounded text-left transition-colors truncate ${
                    selectedCat === cat.key 
                      ? 'bg-foreground text-background font-bold shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground bg-ds-surface2 hover:bg-ds-surface3 border border-ds-border'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Asset Selector list */}
          <div className="border border-ds-border rounded-lg bg-ds-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-ds-border bg-ds-surface2">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Selecionar Ativo ({filteredAssets.length})
              </h3>
            </div>
            
            <div className="divide-y divide-ds-border max-h-[380px] overflow-y-auto scrollbar-none">
              {filteredAssets.map((asset) => {
                const snap = Array.isArray(snapshots) ? snapshots.find(s => s.symbol?.toUpperCase() === asset.ticker?.toUpperCase()) : null;
                const snapChange = snap ? Number(snap.change_percent) : NaN;
                const isSelected = primaryAsset.slug === asset.slug;
                const isComparing = compareAsset?.slug === asset.slug;
                
                return (
                  <div 
                    key={asset.slug}
                    className={`p-3.5 flex items-center justify-between hover:bg-ds-surface2/60 transition-colors group cursor-pointer ${
                      isSelected ? 'bg-ds-surface2 border-l-2 border-[var(--title-accent)]' : ''
                    }`}
                    onClick={() => handleSelectPrimary(asset)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AssetLogo ticker={asset.ticker} name={asset.name} type={asset.type} size={32} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono text-xs font-semibold truncate text-foreground group-hover:text-[var(--title-accent)] transition-colors">
                            {asset.name}
                          </p>
                          <span className="text-[10px] font-semibold text-muted-foreground font-mono">{asset.ticker}</span>
                        </div>
                        <p className="font-sans text-[10px] text-muted-foreground mt-0.5">{asset.sector}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Comparison Overlay Button */}
                      {asset.slug !== primaryAsset.slug && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Evita selecionar como ativo principal
                            handleToggleCompare(asset);
                          }}
                          className={`p-1.5 rounded border transition-colors flex items-center justify-center`}
                          title={isComparing ? "Remover Comparação" : "Comparar"}
                        >
                          <Scale className={`w-3.5 h-3.5 ${
                            isComparing ? 'text-blue-400' : 'text-muted-foreground/30 hover:text-muted-foreground'
                          }`} />
                        </button>
                      )}

                      {/* Small price indicator */}
                      {snap && (
                        <div className="text-right min-w-[64px]">
                          <p className="font-mono text-[11px] font-semibold">{formatMarketPrice(snap)}</p>
                          <p className={`font-mono text-[9px] font-semibold ${
                            snapChange >= 0 ? 'text-ds-up' : 'text-ds-dn'
                          }`}>
                            {Number.isFinite(snapChange) ? (snapChange >= 0 ? '+' : '') + snapChange.toFixed(2) + '%' : '—'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick instructions / Help */}
          <div className="border border-ds-border rounded-lg bg-ds-surface p-4 space-y-3">
            <h4 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--title-accent)]">Recurso de Comparação</h4>
            <p className="font-sans text-[12px] text-muted-foreground leading-relaxed">
              Você pode comparar o rendimento acumulado de dois ativos diferentes. 
              Clique no botão de balança (<Scale className="w-3 h-3 inline text-muted-foreground" />) ao lado do nome de qualquer outro ativo na lista para plotá-lo como uma linha azul. 
              O gráfico passará a exibir o rendimento relativo em **porcentagem (%)**, facilitando a comparação.
            </p>
          </div>
        </div>

      </div>

      {/* Grid of sparkline card widgets */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-0.5 h-4 bg-foreground/20 rounded-full" />
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Destaques de Ativos Globais
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {ASSETS.filter(a => ['ibovespa', 'dolar', 'bitcoin', 'petrobras'].includes(a.slug)).map((asset) => {
            const snap = Array.isArray(snapshots) ? snapshots.find(s => s.symbol?.toUpperCase() === asset.ticker?.toUpperCase()) : null;
            const snapChange = snap ? Number(snap.change_percent) : NaN;
            const active = primaryAsset.slug === asset.slug;

            return (
              <div 
                key={asset.slug}
                onClick={() => handleSelectPrimary(asset)}
                className={`border rounded-lg p-4 bg-ds-surface hover:border-foreground/20 cursor-pointer transition-all ${
                  active ? 'border-[var(--title-accent)] shadow-sm' : 'border-ds-border'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AssetLogo ticker={asset.ticker} name={asset.name} type={asset.type} size={28} />
                    <div>
                      <p className="font-mono text-xs font-semibold leading-tight">{asset.name}</p>
                      <span className="font-mono text-[9px] text-muted-foreground">{asset.ticker}</span>
                    </div>
                  </div>
                  <span className="text-sm">{asset.country}</span>
                </div>

                {snap && (
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-base font-semibold">{formatMarketPrice(snap)}</span>
                    <span className={`font-mono text-[11px] font-bold flex items-center gap-0.5 ${
                      snapChange >= 0 ? 'text-ds-up' : 'text-ds-dn'
                    }`}>
                      {Number.isFinite(snapChange) ? (snapChange >= 0 ? '+' : '') + snapChange.toFixed(2) + '%' : '—'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
