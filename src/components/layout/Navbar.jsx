import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';

const NAV = [
  { label: 'Início',        path: '/' },
  { label: 'Bolsa',         path: '/categoria/bolsa' },
  { label: 'Câmbio',        path: '/categoria/dolar' },
  { label: 'Juros',         path: '/categoria/juros' },
  { label: 'Cripto',        path: '/categoria/criptomoedas' },
  { label: 'Commodities',   path: '/categoria/commodities' },
  { label: 'Empresas',      path: '/categoria/empresas' },
  { label: 'Internacional', path: '/categoria/internacional' },
  { label: 'Economia',      path: '/categoria/economia' },
  { label: 'Renda Fixa',    path: '/categoria/renda_fixa' },
  { label: 'Ativos',        path: '/ativos' },
  { label: '⬡ IA Chat',    path: '/chat' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="sticky top-0 z-50 bg-ds-surface border-b border-ds-border">
      {/* Top strip */}
      <div className="hidden md:block bg-foreground border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-7 flex items-center justify-between">
          <span className="font-mono text-[10px] text-white/30 capitalize tracking-wider">{today}</span>
          <div className="flex items-center gap-5 text-[10px] text-white/30 font-mono tracking-wide">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-ds-up rounded-full animate-pulse" />
              IA ativa · atualização contínua
            </span>
            <Link to="/metodologia" className="hover:text-white/60 transition-colors">Metodologia</Link>
            <Link to="/admin" className="hover:text-white/60 transition-colors">Admin</Link>
          </div>
        </div>
      </div>

      {/* Logo bar */}
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <span className="font-mono text-[18px] font-semibold tracking-tight text-foreground">
            FinAI<span style={{ color: 'var(--accent-color)' }}>Pulse</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-2 ml-auto">
          <Link to="/busca"
            className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded transition-colors hover:bg-ds-surface2">
            <Search className="w-3.5 h-3.5" /> Buscar
          </Link>
        </div>

        <button className="md:hidden text-muted-foreground hover:text-foreground p-1" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Category nav */}
      <div className="hidden md:block border-t border-ds-border bg-ds-surface">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {NAV.map((item) => {
              const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              return (
                <Link key={item.path} to={item.path}
                  className={`font-mono text-[11px] font-medium tracking-wide whitespace-nowrap px-3 py-2.5 border-b-2 transition-colors ${
                    active
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-ds-border'
                  }`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile */}
      {open && (
        <div className="md:hidden border-t border-ds-border bg-ds-surface">
          <div className="p-3 grid grid-cols-2 gap-1">
            {NAV.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
                className={`px-3 py-2 font-mono text-[11px] rounded transition-colors ${
                  pathname === item.path
                    ? 'bg-foreground text-background font-semibold'
                    : 'text-muted-foreground hover:bg-ds-surface2 hover:text-foreground'
                }`}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="px-3 pb-3 flex gap-2">
            <Link to="/busca" onClick={() => setOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 font-mono text-[11px] border border-ds-border rounded py-2 text-muted-foreground hover:text-foreground hover:bg-ds-surface2 transition-colors">
              <Search className="w-3.5 h-3.5" /> Buscar
            </Link>
            <Link to="/admin" onClick={() => setOpen(false)}
              className="flex-1 flex items-center justify-center font-mono text-[11px] border border-ds-border rounded py-2 text-muted-foreground hover:text-foreground hover:bg-ds-surface2 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}