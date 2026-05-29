import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Search, Menu, X } from 'lucide-react';

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
  { label: '🤖 Chat', path: '/chat' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      {/* Slim top strip */}
      <div className="hidden md:block border-b border-border/50 bg-foreground">
        <div className="max-w-7xl mx-auto px-4 h-7 flex items-center justify-between">
          <span className="text-[11px] text-background/40 capitalize">{today}</span>
          <div className="flex items-center gap-4 text-[11px] text-background/40">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              IA ativa — atualização contínua
            </span>
            <Link to="/admin" className="hover:text-background/70 transition-colors">Admin</Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-foreground rounded flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-background" />
          </div>
          <span className="text-[17px] font-black tracking-tight font-display">FinAI<span className="text-primary"> Pulse</span></span>
        </Link>

        {/* Desktop: search + admin */}
        <div className="hidden md:flex items-center gap-1 ml-auto">
          <Link to="/busca"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span>Buscar</span>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-muted-foreground hover:text-foreground p-1" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Category nav — desktop */}
      <div className="hidden md:block border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center overflow-x-auto scrollbar-hide">
            {categories.map((cat) => {
              const active = location.pathname === cat.path;
              return (
                <Link key={cat.path} to={cat.path}
                  className={`px-3 py-2 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}>
                  {cat.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="p-3 grid grid-cols-2 gap-1">
            {categories.map((cat) => (
              <Link key={cat.path} to={cat.path} onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  location.pathname === cat.path
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}>
                {cat.label}
              </Link>
            ))}
          </div>
          <div className="px-3 pb-3 flex gap-2">
            <Link to="/busca" onClick={() => setMobileOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-border rounded-md py-2 text-muted-foreground hover:text-foreground">
              <Search className="w-3.5 h-3.5" /> Buscar
            </Link>
            <Link to="/admin" onClick={() => setMobileOpen(false)}
              className="flex-1 flex items-center justify-center text-xs border border-border rounded-md py-2 text-muted-foreground hover:text-foreground">
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}