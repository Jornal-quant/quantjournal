import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryLabels = {
  bolsa: 'Bolsa',
  renda_fixa: 'Renda Fixa',
  juros: 'Juros',
  dolar: 'Dólar',
  economia: 'Economia',
  criptomoedas: 'Cripto',
  commodities: 'Commodities',
  empresas: 'Empresas',
  internacional: 'Internacional',
};

const categoryStyles = {
  bolsa: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  economia: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  dolar: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  juros: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  criptomoedas: 'bg-accent/10 text-accent border-accent/20',
  commodities: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  empresas: 'bg-primary/10 text-primary border-primary/20',
  internacional: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  renda_fixa: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
};

export default function ArticleCard({ article, variant = 'default' }) {
  const timeAgo = article.created_date
    ? formatDistanceToNow(new Date(article.created_date), { addSuffix: true, locale: ptBR })
    : '';

  if (variant === 'featured') {
    return (
      <Link to={`/artigo/${article.id}`} className="group block">
        <div className="relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
          {article.image_url && (
            <div className="aspect-video overflow-hidden">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              {article.relevance === 'urgente' && (
                <Badge className="bg-destructive text-destructive-foreground text-[10px] uppercase tracking-wider">Urgente</Badge>
              )}
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wider border ${categoryStyles[article.category] || ''}`}>
                {categoryLabels[article.category] || article.category}
              </Badge>
            </div>
            <h2 className="text-xl md:text-2xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors font-display">
              {article.title}
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.summary}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>
              {article.source && <span>• {article.source}</span>}
              {article.views > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.views}</span>}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to={`/artigo/${article.id}`} className="group block">
        <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`text-[9px] uppercase tracking-wider border ${categoryStyles[article.category] || ''}`}>
                {categoryLabels[article.category] || article.category}
              </Badge>
            </div>
            <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h3>
            <span className="text-[11px] text-muted-foreground mt-1 block">{timeAgo}</span>
          </div>
          {article.image_url && (
            <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
              <img src={article.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/artigo/${article.id}`} className="group block">
      <div className="rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-md">
        {article.image_url && (
          <div className="aspect-video overflow-hidden">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider border ${categoryStyles[article.category] || ''}`}>
              {categoryLabels[article.category] || article.category}
            </Badge>
            {article.relevance === 'urgente' && (
              <Badge className="bg-destructive text-destructive-foreground text-[10px]">Urgente</Badge>
            )}
          </div>
          <h3 className="font-bold leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{article.summary}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{timeAgo}</span>
            {article.source && <span>• {article.source}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}