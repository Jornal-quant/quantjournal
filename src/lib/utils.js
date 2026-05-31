import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}


export const isIframe = window.self !== window.top;

/* ───────────────────────── Datas ───────────────────────── */

// Distância até agora em pt-BR. Trava datas no futuro em "agora" para
// nunca exibir "em cerca de 2 horas" para conteúdo já publicado (clock skew).
export function timeAgo(date) {
  if (!date) return "";
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return "";
  const clamped = Math.min(t, Date.now());
  return formatDistanceToNow(new Date(clamped), { addSuffix: true, locale: ptBR });
}

/* ──────────────────── Dados de mercado ──────────────────── */

// Faixas plausíveis por símbolo. Usado para descartar dados claramente
// quebrados vindos do backend (ex.: Ouro a US$ 418, Selic a 0%).
const MARKET_SANITY = {
  IBOV: [50000, 400000],
  IFIX: [1000, 6000],
  SPX: [1000, 20000],
  "S&P500": [1000, 20000],
  "USD/BRL": [1, 20],
  "EUR/BRL": [1, 25],
  "EUR/USD": [0.5, 2],
  BTC: [1000, 1000000],
  ETH: [50, 100000],
  SELIC: [0.01, 30],
  GOLD: [500, 15000],
  OURO: [500, 15000],
  OIL: [5, 250],
  WTI: [5, 250],
};

// true se o snapshot tem preço plausível. Símbolos desconhecidos passam.
export function isSaneSnapshot(s) {
  if (!s) return false;
  // A API (Neon) serializa colunas numéricas como string; coage antes de validar.
  const price = Number(s.price);
  if (!Number.isFinite(price)) return false;
  const change = Number(s.change_percent);
  if (Number.isFinite(change) && Math.abs(change) > 80) return false;
  const range = MARKET_SANITY[s.symbol];
  if (range && (price < range[0] || price > range[1])) return false;
  return true;
}

// Formatação única e consistente (pt-BR) para preços de mercado.
// Substitui as três implementações divergentes (Ticker/Radar/Sidebar).
export function formatMarketPrice(s) {
  const p = Number(s?.price);
  if (!Number.isFinite(p)) return "—";
  const dec2 = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  switch (s.market_type) {
    case "rate":
      return `${p.toLocaleString("pt-BR", dec2)}%`;
    case "fx":
      return `R$ ${p.toLocaleString("pt-BR", dec2)}`;
    case "index":
      return p.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
    default: {
      // crypto / commodity em USD
      if (p >= 50000) return `US$ ${(p / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
      if (p >= 1000) return `US$ ${p.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
      return `US$ ${p.toLocaleString("pt-BR", dec2)}`;
    }
  }
}

// "+1,92%" / "-1,10%" / "—" com vírgula decimal pt-BR.
export function formatChangePercent(cp) {
  const n = Number(cp);
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}
