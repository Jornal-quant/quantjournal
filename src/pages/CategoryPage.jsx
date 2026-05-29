import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import ArticleCard from '../components/news/ArticleCard';
import NewsletterForm from '../components/news/NewsletterForm';
import { Skeleton } from '@/components/ui/skeleton';

const categoryLabels = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Dólar',
  economia: 'Economia', criptomoedas: 'Criptomoedas', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

export default function CategoryPage() {
  const { category } = useParams();

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles-category', category],
    queryFn: () => base44.entities.Article.filter({ category, status: 'publicado' }, '-created_date', 50),
  });

  const label = categoryLabels[category] || category;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-display">{label}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {articles.length} {articles.length === 1 ? 'notícia' : 'notícias'} nesta categoria
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video rounded-xl" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {articles.length > 0 && (
              <div className="mb-6">
                <ArticleCard article={articles[0]} variant="featured" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {articles.slice(1).map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
            {articles.length === 0 && (
              <p className="text-muted-foreground text-center py-12">Nenhuma notícia nesta categoria ainda.</p>
            )}
          </div>
          <aside>
            <NewsletterForm />
          </aside>
        </div>
      )}
    </div>
  );
}