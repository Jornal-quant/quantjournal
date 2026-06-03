import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, Zap, LogOut, LogIn } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import BrandMark from '@/components/BrandMark';
import { useAuth } from '@/lib/AuthContext';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Controle de conta no header: "Entrar" quando deslogado; menu com nome/e-mail
// e "Sair" quando logado.
function AccountMenu() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <Link to="/login"
        className="flex items-center gap-1.5 font-mono text-[12px] text-foreground/70 hover:text-foreground px-2.5 py-1.5 rounded hover:bg-foreground/6 transition-colors duration-150">
        <LogIn className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Entrar</span>
      </Link>
    );
  }

  const label = user?.full_name || user?.email || 'Conta';
  const initial = String(label).trim().charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 font-mono text-[12px] text-foreground/70 hover:text-foreground px-1.5 py-1 rounded hover:bg-foreground/6 transition-colors duration-150"
          aria-label="Conta">
          <span className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-[11px] font-semibold text-foreground/70">
            {initial}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-mono text-[11px] truncate">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user?.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="font-mono text-[12px] cursor-pointer">Admin</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => logout()}
          className="font-mono text-[12px] cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="w-3.5 h-3.5 mr-2" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const NAV = [
  { label: 'Bolsa',         path: '/categoria/bolsa' },
  { label: 'Câmbio',        path: '/categoria/dolar' },
  { label: 'Juros',         path: '/categoria/juros' },
  { label: 'Cripto',        path: '/categoria/criptomoedas' },
  { label: 'Commodities',   path: '/categoria/commodities' },
  { label: 'Empresas',      path: '/categoria/empresas' },
  { label: 'Internacional', path: '/categoria/internacional' },
  { label: 'Economia',      path: '/categoria/economia' },
  { label: 'Renda Fixa',   path: '/categoria/renda_fixa' },
  { label: 'Ativos',        path: '/ativos' },
  { label: 'Gráficos',      path: '/graficos' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="sticky top-0 z-50 bg-[hsl(var(--background))] border-b border-foreground/8">
      {/* Top metadata strip */}
      <div className="hidden md:flex items-center justify-between px-6 h-7 border-b border-foreground/5 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-foreground/40 capitalize">{today}</span>
          <span className="text-foreground/10">·</span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-foreground/60">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Análise contínua por IA
          </span>
        </div>
        <div className="flex items-center gap-5 font-mono text-[11px] text-foreground/60">
          <Link to="/metodologia" className="hover:text-foreground/50 transition-colors duration-150">Metodologia</Link>
          <span className="text-foreground/10">|</span>
          <Link to="/admin" className="hover:text-foreground/50 transition-colors duration-150">Admin</Link>
        </div>
      </div>

      {/* Main navbar */}
      <div className="max-w-screen-2xl mx-auto px-6 h-12 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <BrandMark className="h-6 w-auto text-foreground group-hover:opacity-80 transition-opacity duration-150" />
          <span className="font-mono text-[16px] font-semibold tracking-tight text-foreground">
            Capital <span className="text-[var(--title-accent)]">Times</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {NAV.map((item) => {
            const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path}
                className={`font-mono text-[12px] font-medium tracking-wide whitespace-nowrap px-3 py-1.5 rounded transition-colors duration-150 ${
                  active
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-foreground/60 hover:text-foreground/70 hover:bg-foreground/6'
                }`}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <Link to="/chat"
            className="hidden sm:flex items-center gap-1.5 font-mono text-[12px] font-medium text-foreground/65 hover:text-foreground bg-foreground/6 hover:bg-foreground/10 border border-foreground/10 px-3 py-1.5 rounded transition-all duration-150">
            <Zap className="w-3 h-3" />
            IA Chat
          </Link>
          <Link to="/busca"
            className="flex items-center gap-1.5 font-mono text-[12px] text-foreground/70 hover:text-foreground px-2.5 py-1.5 rounded hover:bg-foreground/6 transition-colors duration-150">
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Buscar</span>
          </Link>
          <AccountMenu />
          <ThemeToggle />
          <button className="lg:hidden text-foreground/65 hover:text-foreground/80 p-1.5 transition-colors duration-150" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-foreground/8 bg-[hsl(var(--background))]">
          <div className="px-4 py-3 grid grid-cols-2 gap-1">
            {NAV.map((item) => {
              const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              return (
                <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
                  className={`px-3 py-2 font-mono text-[12px] rounded transition-colors duration-150 ${
                    active ? 'bg-foreground/12 text-foreground font-semibold' : 'text-foreground/60 hover:bg-foreground/6 hover:text-foreground/70'
                  }`}>
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            <Link to="/chat" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 font-mono text-[12px] border border-foreground/12 rounded py-2 text-foreground/70 hover:text-foreground/85 hover:bg-foreground/6 transition-colors duration-150">
              <Zap className="w-3.5 h-3.5" /> IA Chat
            </Link>
            <Link to="/busca" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 font-mono text-[12px] border border-foreground/12 rounded py-2 text-foreground/70 hover:text-foreground/85 hover:bg-foreground/6 transition-colors duration-150">
              <Search className="w-3.5 h-3.5" /> Buscar
            </Link>
            {isAuthenticated ? (
              <button onClick={() => { setOpen(false); logout(); }}
                className="flex items-center justify-center gap-1.5 font-mono text-[12px] border border-foreground/12 rounded py-2 text-destructive hover:bg-foreground/6 transition-colors duration-150">
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 font-mono text-[12px] border border-foreground/12 rounded py-2 text-foreground/70 hover:text-foreground/85 hover:bg-foreground/6 transition-colors duration-150">
                <LogIn className="w-3.5 h-3.5" /> Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
