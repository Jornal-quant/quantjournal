import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, Bot, Rss } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-foreground text-background mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-background/10 rounded-md flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-background" />
              </div>
              <span className="text-base font-black font-display">FinAI Pulse</span>
              <span className="text-[9px] bg-primary text-primary-foreground font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">PRO</span>
            </div>
            <p className="text-sm text-background/50 leading-relaxed mb-4">
              Notícias financeiras geradas e curadas por inteligência artificial, 24h por dia.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-background/40">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Atualizado continuamente por IA
            </div>
          </div>

          {/* Mercados */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-background/40 mb-4">Mercados</h4>
            <div className="space-y-2.5">
              {[['Bolsa', '/categoria/bolsa'], ['Dólar', '/categoria/dolar'], ['Juros', '/categoria/juros'], ['Criptomoedas', '/categoria/criptomoedas'], ['Commodities', '/categoria/commodities']].map(([l, p]) => (
                <Link key={p} to={p} className="block text-sm text-background/60 hover:text-background transition-colors">{l}</Link>
              ))}
            </div>
          </div>

          {/* Análises */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-background/40 mb-4">Análises</h4>
            <div className="space-y-2.5">
              {[['Economia', '/categoria/economia'], ['Empresas', '/categoria/empresas'], ['Internacional', '/categoria/internacional'], ['Renda Fixa', '/categoria/renda_fixa'], ['Ativos', '/ativos']].map(([l, p]) => (
                <Link key={p} to={p} className="block text-sm text-background/60 hover:text-background transition-colors">{l}</Link>
              ))}
            </div>
          </div>

          {/* Ferramentas */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-background/40 mb-4">Ferramentas</h4>
            <div className="space-y-2.5">
              <Link to="/chat" className="flex items-center gap-2 text-sm text-background/60 hover:text-background transition-colors">
                <Bot className="w-3.5 h-3.5" /> FinanceChat IA
              </Link>
              <Link to="/busca" className="block text-sm text-background/60 hover:text-background transition-colors">Busca de Notícias</Link>
              <Link to="/admin" className="block text-sm text-background/60 hover:text-background transition-colors">Painel Admin</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-background/30">
            © {new Date().getFullYear()} FinAI Pulse. Conteúdo gerado por IA.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-background/30">
            <Shield className="w-3 h-3" />
            <span>Não constitui recomendação de investimento. Consulte um assessor financeiro.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}