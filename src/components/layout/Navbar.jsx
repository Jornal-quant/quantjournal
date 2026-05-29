import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Search, Menu, X, Zap } from 'lucide-react';
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
  { label: 'Ativos', path: '/ativos' },
  { label: '🤖 FinanceChat', path: '/chat' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="sticky top-0 z-50 bg-card/98 backdrop-blur-md border-b border-border shadow-sm">
      {/* Top identity bar */}
      <div className="bg-foreground text-background hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between">
          <span className="text-[11px] font-medium capitalize text-background/70">{today}</span>
          <div className="flex items-center gap-4 text-[11px] font-medium text-background/70">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-chart-2 rounded-full animate-pulse" />
              Atualizado automaticamente por IA
            </span>
            <Link to="/admin" className="text-background/50 hover:text-background transition-colors">Admin</Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-background" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tracking-tight font-display">FinAI Pulse</span>
              <span className="hidden sm:block text-[9px] bg-primary text-primary-foreground font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">PRO</span>
            </div>
          </Link>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/busca">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                <Search className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Category nav */}
      <div className="border-t border-border/40 hidden md:block bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.path}
                to={cat.path}
                className={`px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  location.pathname === cat.path
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
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
        <div className="md:hidden border-t border-border bg-card shadow-xl">
          <div className="p-4 grid grid-cols-2 gap-1">
            {categories.map((cat) => (
              <Link
                key={cat.path}
                to={cat.path}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              >
                {cat.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-border px-4 py-3 flex gap-2">
            <Link to="/busca" onClick={() => setMobileOpen(false)} className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                <Search className="w-3.5 h-3.5" /> Buscar
              </Button>
            </Link>
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs">Admin</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}