import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold font-display">FinanceNews</span>
              <span className="text-[10px] text-accent font-semibold uppercase tracking-widest">AI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Notícias financeiras geradas e curadas por inteligência artificial, 24 horas por dia.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Mercados</h4>
            <div className="space-y-2">
              {['Bolsa', 'Dólar', 'Juros', 'Cripto'].map((item) => (
                <Link key={item} to={`/categoria/${item.toLowerCase()}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Categorias</h4>
            <div className="space-y-2">
              {['Economia', 'Empresas', 'Commodities', 'Internacional'].map((item) => (
                <Link key={item} to={`/categoria/${item.toLowerCase()}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Plataforma</h4>
            <div className="space-y-2">
              <Link to="/busca" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Busca</Link>
              <Link to="/admin" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FinanceNews AI. Conteúdo gerado por inteligência artificial. Não constitui recomendação de investimento.
          </p>
        </div>
      </div>
    </footer>
  );
}