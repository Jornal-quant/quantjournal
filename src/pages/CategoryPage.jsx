import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';
import ArticleCard from '../components/news/ArticleCard';
import HeroSection from '../components/home/HeroSection';
import EconomicCalendar from '../components/home/EconomicCalendar';
import NewsletterForm from '../components/news/NewsletterForm';

const CAT_LABELS = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros',
  dolar: 'Câmbio', economia: 'Economia', criptomoedas: 'Criptomoedas',
  commodities: 'Commodities', empresas: 'Empresas', internacional: 'Internacional',
};

const CAT_DESC = {
  bolsa: 'Análises sobre o Ibovespa, ações brasileiras, resultados corporativos e movimentos do mercado de capitais.',
  renda_fixa: 'Cobertura de títulos públicos, debêntures, CDBs e impactos da política monetária na renda fixa.',
  juros: 'Decisões do COPOM, trajetória da Selic, expectativas do mercado e reflexos nos investimentos.',
  dolar: 'Variações do câmbio USD/BRL, fatores macroeconômicos, impacto em exportadoras e importadoras.',
  economia: 'Indicadores macroeconômicos, PIB, inflação (IPCA, IGP-M), emprego e política fiscal brasileira.',
  criptomoedas: 'Bitcoin, Ethereum e mercado cripto: movimentos de preço, regulação e adoção institucional.',
  commodities: 'Petróleo, minério de ferro, soja, ouro e seu impacto nas empresas e no balanço comercial.',
  empresas: 'Resultados trimestrais, dividendos, M&A, IPOs e análises de empresas listadas na B3 e no exterior.',
  internacional: 'Fed, BCE, economia americana, China e eventos globais com impacto nos mercados brasileiros.',
};

const ALL_CATEGORIES = Object.keys(CAT_LABELS);

export default function CategoryPage() {
  const { category } = useParams();
  const label = CAT_LABELS[category] || category;
  const desc = CAT_DESC[category] || `Notícias e análises sobre ${label} geradas e curadas por inteligência artificial.`;

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles-category', category],
    queryFn: () => base44.entities.Article.filter({ category, status: 'publicado' }, '-created_date', 50),
  });

  const otherCats = ALL_CATEGORIES.filter((c) => c !== category).slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">{label}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 pb-6 border-b border-ds-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-widest bg-foreground text-background px-2 py-1 rounded-sm">{label}</span>
          {!isLoading && (
            <span className="font-mono text-[10px] text-muted-foreground">{articles.length} {articles.length === 1 ? 'análise' : 'análises'}</span>
          )}
        </div>
        <h1 className="font-mono text-2xl md:text-3xl font-semibold mb-2">{label}</h1>
        <p className="font-sans text-sm text-muted-foreground max-w-2xl leading-relaxed">{desc}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video rounded-lg" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        /* Empty state */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-8">
          <div>
            <div className="border border-ds-border rounded-lg p-12 text-center bg-ds-surface2 space-y-4">
              <div className="font-mono text-4xl text-muted-foreground/10">⬡</div>
              <h2 className="font-mono text-base font-semibold">Nenhuma análise publicada ainda</h2>
              <p className="font-sans text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Esta categoria ainda não possui artigos publicados. O sistema coleta e publica automaticamente — volte em breve ou explore outras categorias.
              </p>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {otherCats.map((c) => (
                  <Link key={c} to={`/categoria/${c}`}
                    className="font-mono text-[11px] border border-ds-border rounded px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-ds-surface2 transition-colors">
                    {CAT_LABELS[c]}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <aside className="space-y-4">
            <EconomicCalendar />
            <NewsletterForm />
          </aside>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-10">
          <div className="space-y-8 min-w-0">
            {/* Hero */}
            <HeroSection articles={articles.slice(0, 4)} />
            {/* Grid */}
            {articles.length > 4 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-0.5 h-4 bg-foreground/20 rounded-full" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Mais análises</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {articles.slice(4).map((a) => <ArticleCard key={a.id} article={a} />)}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            {/* Other categories */}
            <div className="border border-ds-border rounded-lg overflow-hidden bg-ds-surface">
              <div className="px-4 py-2.5 border-b border-ds-border bg-ds-surface2">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Outras categorias</h3>
              </div>
              <div className="divide-y divide-ds-border">
                {otherCats.map((c) => (
                  <Link key={c} to={`/categoria/${c}`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-ds-surface2 transition-colors group">
                    <span className="font-mono text-xs font-medium group-hover:text-ds-beige transition-colors">{CAT_LABELS[c]}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </Link>
                ))}
              </div>
            </div>
            <EconomicCalendar />
            <NewsletterForm />
            <p className="font-mono text-[9px] text-muted-foreground/30 px-1 leading-relaxed">
              Conteúdo gerado por IA com fins informativos. Não constitui recomendação de investimento.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}