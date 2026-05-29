import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ArticleCard from '../components/news/ArticleCard';

const CATEGORIES = [
  { value: '', label: 'Todas' },
  { value: 'bolsa', label: 'Bolsa' },
  { value: 'economia', label: 'Economia' },
  { value: 'dolar', label: 'Câmbio' },
  { value: 'juros', label: 'Juros' },
  { value: 'criptomoedas', label: 'Cripto' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'empresas', label: 'Empresas' },
  { value: 'internacional', label: 'Internacional' },
  { value: 'renda_fixa', label: 'Renda Fixa' },
];

const SENTIMENTS = [
  { value: '', label: 'Qualquer' },
  { value: 'positivo', label: 'Positivo ↑' },
  { value: 'negativo', label: 'Negativo ↓' },
  { value: 'neutro', label: 'Neutro' },
  { value: 'misto', label: 'Misto' },
];

const IMPACTS = [
  { value: '', label: 'Qualquer' },
  { value: 'critico', label: 'Crítico' },
  { value: 'alto', label: 'Alto' },
  { value: 'medio', label: 'Médio' },
  { value: 'baixo', label: 'Baixo' },
];

const PERIODS = [
  { value: '', label: 'Qualquer período' },
  { value: '1d', label: 'Últimas 24h' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Último mês' },
];

const SUGGESTIONS = [
  'Petrobras', 'Selic', 'Fed juros', 'Bitcoin', 'Dólar', 'PETR4', 'Vale', 'Ibovespa', 'Inflação', 'Nvidia',
];

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs bg-ds-surface border border-ds-border rounded px-2.5 py-2 text-foreground outline-none focus:border-foreground transition-colors">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function inPeriod(dateStr, period) {
  if (!period || !dateStr) return true;
  const d = new Date(dateStr);
  const now = Date.now();
  if (period === '1d') return now - d.getTime() < 86400000;
  if (period === '7d') return now - d.getTime() < 7 * 86400000;
  if (period === '30d') return now - d.getTime() < 30 * 86400000;
  return true;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [impact, setImpact] = useState('');
  const [period, setPeriod] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searched, setSearched] = useState(false);

  // Read ?q= from URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get('q');
    if (q) { setQuery(q); setSearched(true); }
  }, []);

  const { data: allArticles = [], isLoading } = useQuery({
    queryKey: ['search-articles'],
    queryFn: () => base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 200),
    staleTime: 2 * 60 * 1000,
  });

  const results = searched ? allArticles.filter((a) => {
    const q = query.toLowerCase();
    const matchText = !q || a.title?.toLowerCase().includes(q) || a.summary?.toLowerCase().includes(q) ||
      a.tickers?.toLowerCase().includes(q) || a.affected_companies?.toLowerCase().includes(q) ||
      a.tags?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q) || a.source?.toLowerCase().includes(q);
    const matchCat = !cat || a.category === cat;
    const matchSentiment = !sentiment || a.sentiment === sentiment;
    const matchImpact = !impact || a.impact_level === impact;
    const matchPeriod = inPeriod(a.created_date, period);
    return matchText && matchCat && matchSentiment && matchImpact && matchPeriod;
  }) : [];

  const hasFilters = cat || sentiment || impact || period;
  const clearFilters = () => { setCat(''); setSentiment(''); setImpact(''); setPeriod(''); };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Busca</p>
        <h1 className="font-mono text-2xl font-semibold mb-1">Busca inteligente</h1>
        <p className="font-sans text-sm text-muted-foreground">
          Pesquise por empresas, tickers, temas, categorias ou eventos de mercado.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Petrobras, taxa Selic, Fed, Bitcoin..."
            className="w-full font-mono text-sm pl-10 pr-4 py-3 bg-ds-surface border border-ds-border rounded outline-none focus:border-foreground transition-colors"
          />
        </div>
        <button
          type="submit"
          className="font-mono text-sm font-semibold bg-foreground text-background px-6 py-3 rounded hover:opacity-90 transition-opacity">
          Buscar
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 font-mono text-sm px-4 py-3 rounded border transition-colors ${
            showFilters || hasFilters ? 'bg-foreground text-background border-foreground' : 'bg-ds-surface border-ds-border text-muted-foreground hover:text-foreground'
          }`}>
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {hasFilters && <span className="font-mono text-[9px] bg-white/20 rounded-full w-4 h-4 flex items-center justify-center">!</span>}
        </button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="bg-ds-surface2 border border-ds-border rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FilterSelect label="Categoria"  value={cat}       onChange={setCat}       options={CATEGORIES} />
            <FilterSelect label="Sentimento" value={sentiment}  onChange={setSentiment}  options={SENTIMENTS} />
            <FilterSelect label="Impacto"    value={impact}     onChange={setImpact}     options={IMPACTS} />
            <FilterSelect label="Período"    value={period}     onChange={setPeriod}     options={PERIODS} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3 h-3" /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Suggestions */}
      {!searched && (
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Sugestões de busca</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => { setQuery(s); setSearched(true); }}
                className="font-mono text-xs text-muted-foreground border border-ds-border rounded px-3 py-1.5 hover:bg-ds-surface2 hover:text-foreground transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading && (
        <p className="font-mono text-sm text-muted-foreground">Carregando artigos...</p>
      )}

      {searched && !isLoading && (
        <>
          <div className="flex items-center justify-between mb-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
              {query ? ` para "${query}"` : ''}
            </p>
            {searched && (
              <button onClick={() => { setSearched(false); setQuery(''); clearFilters(); }}
                className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3 h-3" /> Limpar busca
              </button>
            )}
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          ) : (
            <div className="text-center py-16 space-y-2">
              <div className="font-mono text-3xl text-muted-foreground/10">⬡</div>
              <p className="font-mono text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
              <p className="font-sans text-xs text-muted-foreground/60">Tente outros termos ou remova os filtros.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}