import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ArticleCard from '../components/news/ArticleCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    const allArticles = await base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 100);
    const q = query.toLowerCase();
    const filtered = allArticles.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.tags?.toLowerCase().includes(q) ||
        a.affected_companies?.toLowerCase().includes(q) ||
        a.tickers?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q)
    );
    setResults(filtered);
    setLoading(false);
  };

  const suggestions = [
    'Petrobras', 'Taxa Selic', 'Fed juros', 'Bitcoin', 'Dólar hoje', 'Resultados trimestrais'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold font-display">Busca Inteligente</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Pesquise por empresas, tickers, temas ou eventos financeiros
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Notícias sobre Petrobras..."
            className="pl-10 h-12 text-base"
          />
        </div>
        <Button type="submit" className="h-12 px-6" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
        </Button>
      </form>

      {!searched && (
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {suggestions.map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => { setQuery(s); }}
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      {searched && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {results.length} {results.length === 1 ? 'resultado' : 'resultados'} para "{query}"
          </p>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhum resultado encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}