import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Search, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  { label: 'Bolsa', path: '/categoria/bolsa' },
  { label: 'Economia', path: '/categoria/economia' },
  { label: 'Dólar', path: '/categoria/dolar' },
  { label: 'Juros', path: '/categoria/juros' },
  { label: 'Cripto', path: '/categoria/criptomoedas' },
  { label: 'Commodities', path: '/categoria/commodities' },
  { label: 'Empresas', path: '/categoria/empresas' },
  { label: 'Internacional', path: '/categoria/internacional' },
  { label: 'Renda Fixa', path: '/categoria/renda_fixa' },
  { label: '⚡ Ativos', path: '/ativos' },
  { label: '🤖 FinanceChat', path: '/chat' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight font-display">FinanceNews</span>
              <span className="text-[10px] text-accent font-semibold ml-1 uppercase tracking-widest">AI</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/busca">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Search className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="sm" className="text-xs">
                Admin
              </Button>
            </Link>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Categories bar */}
      <div className="border-t border-border/50 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.path}
                to={cat.path}
                className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  location.pathname === cat.path
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="p-4 space-y-1">
            {categories.map((cat) => (
              <Link
                key={cat.path}
                to={cat.path}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              >
                {cat.label}
              </Link>
            ))}
            <hr className="my-2 border-border" />
            <Link to="/busca" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
              Busca
            </Link>
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}