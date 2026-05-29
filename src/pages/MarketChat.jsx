import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  'O que movimentou o mercado hoje?',
  'Por que o Bitcoin caiu recentemente?',
  'Resuma as notícias sobre Petrobras',
  'Quais ativos foram impactados pelo Fed?',
  'Compare o sentimento sobre PETR4 e VALE3',
  'Quais são os principais riscos para o mercado esta semana?',
  'Como a Selic impacta a renda fixa?',
  'Quais setores se beneficiam com dólar alto?',
];

const INITIAL_MSG = {
  role: 'assistant',
  content: 'Olá. Sou o **Market Chat** do FinAI Pulse.\n\nRespondo com base nas notícias, artigos e dados disponíveis na plataforma. Faça perguntas sobre ativos, eventos de mercado, índices ou temas econômicos.\n\n**Importante:** as respostas são informativas e não constituem recomendação de investimento.',
};

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 bg-foreground rounded flex items-center justify-center flex-shrink-0 mt-1">
          <span className="font-mono text-[10px] text-white/60">⬡</span>
        </div>
      )}
      <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
        isUser ? 'bg-foreground text-background' : 'bg-ds-surface2 border border-ds-border'
      }`}>
        {isUser ? (
          <p className="font-sans text-sm">{msg.content}</p>
        ) : (
          <ReactMarkdown
            className="font-sans text-sm leading-relaxed [&>p]:my-1.5 [&>ul]:my-2 [&>ul]:ml-4 [&>ul]:list-disc [&>ol]:my-2 [&>ol]:ml-4 [&>ol]:list-decimal [&>li]:my-0.5 [&>strong]:font-semibold [&>h3]:font-mono [&>h3]:text-xs [&>h3]:font-semibold [&>h3]:uppercase [&>h3]:tracking-wider [&>h3]:text-muted-foreground [&>h3]:mt-3 [&>h3]:mb-1"
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function MarketChat() {
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);

    const recentArticles = await base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 20);
    const context = recentArticles.slice(0, 12).map((a) =>
      `• [${a.category?.toUpperCase()}] ${a.title}${a.summary ? ': ' + a.summary.slice(0, 120) : ''}${a.tickers ? ' — Tickers: ' + a.tickers : ''}`
    ).join('\n');

    const history = messages.slice(-6).map((m) =>
      `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content.slice(0, 200)}`
    ).join('\n');

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é o Market Chat do FinAI Pulse, uma plataforma de análise financeira brasileira. Responda em português de forma clara, analítica e objetiva.

REGRAS IMPORTANTES:
- Use linguagem analítica: "pode pressionar", "tende a favorecer", "o mercado interpreta", "investidores acompanham"
- NUNCA use: "compre", "venda", "vai subir", "vai cair", "garantido", "lucro certo"
- Baseie respostas nas notícias da plataforma quando relevante
- Seja conciso (máx 350 palavras) mas completo
- Use markdown (bullets, bold) para organizar
- Ao final de respostas sobre ativos específicos, inclua: "⚠️ Conteúdo informativo — não constitui recomendação de investimento."

Notícias recentes da plataforma:
${context || 'Sem notícias recentes disponíveis.'}

Histórico:
${history}

Pergunta: "${q}"`,
      add_context_from_internet: true,
    });

    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const reset = () => setMessages([INITIAL_MSG]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 md:py-8 flex flex-col" style={{ minHeight: 'calc(100vh - 180px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-foreground rounded flex items-center justify-center">
            <span className="font-mono text-sm text-white/60">⬡</span>
          </div>
          <div>
            <h1 className="font-mono text-base font-semibold">Market Chat</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-ds-up rounded-full animate-pulse" />
              <span className="font-mono text-[10px] text-muted-foreground">Conectado · Dados da plataforma + internet</span>
            </div>
          </div>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors border border-ds-border px-3 py-1.5 rounded hover:bg-ds-surface2">
          <RefreshCw className="w-3.5 h-3.5" /> Nova conversa
        </button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="font-sans text-[11px] text-amber-700 leading-relaxed">
          As respostas são geradas por IA com finalidade informativa e podem conter imprecisões. Verifique as fontes antes de tomar decisões financeiras. Não constitui recomendação de investimento.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 mb-5 overflow-y-auto" style={{ minHeight: '300px' }}>
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-foreground rounded flex items-center justify-center flex-shrink-0 mt-1">
              <span className="font-mono text-[10px] text-white/60">⬡</span>
            </div>
            <div className="bg-ds-surface2 border border-ds-border rounded-lg px-4 py-3 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-mono text-[11px]">Analisando mercado...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="mb-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Sugestões de perguntas</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={loading}
                className="font-mono text-[11px] text-muted-foreground border border-ds-border rounded px-3 py-1.5 hover:bg-ds-surface2 hover:text-foreground transition-colors disabled:opacity-40 text-left">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre qualquer ativo, índice ou notícia..."
          disabled={loading}
          className="flex-1 font-mono text-sm px-4 py-3 bg-ds-surface border border-ds-border rounded outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center gap-1.5 font-mono text-sm font-semibold bg-foreground text-background px-4 py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-30">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      <p className="font-mono text-[9px] text-muted-foreground/30 text-center mt-2">
        O FinAI Pulse responde com base em notícias públicas e dados da plataforma. Não constitui recomendação de investimento.
      </p>
    </div>
  );
}