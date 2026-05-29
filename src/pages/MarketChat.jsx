import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Send, Loader2, Bot, User,
  TrendingUp, RefreshCw, Lightbulb
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

const SUGGESTIONS = [
  'O que aconteceu com a Petrobras hoje?',
  'Quais empresas se beneficiam com a queda da Selic?',
  'Impacto do Fed no mercado brasileiro',
  'Vale a pena comprar PETR4 agora?',
  'Como a inflação afeta meus investimentos?',
  'Quais setores crescem com o dólar alto?',
];

export default function MarketChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! Sou o **FinanceChat**, seu assistente de mercado financeiro com IA. Posso responder sobre empresas, ações, indicadores econômicos e as últimas notícias do mercado.\n\nO que você quer saber hoje?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question) return;

    const userMsg = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Fetch recent articles for context
    const recentArticles = await base44.entities.Article.filter({ status: 'publicado' }, '-created_date', 20);
    const context = recentArticles
      .slice(0, 10)
      .map((a) => `• ${a.title}: ${a.summary || ''}`)
      .join('\n');

    const history = messages.slice(-6).map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é o FinanceChat, um assistente de mercado financeiro especializado. Responda em português brasileiro, de forma clara, objetiva e útil para investidores.

Notícias recentes do portal (contexto):
${context}

Histórico da conversa:
${history}

Pergunta atual: "${question}"

Instruções:
- Responda de forma direta e útil
- Use dados e contexto das notícias recentes quando relevante
- Explique impactos em: bolsa, dólar, juros, cripto quando aplicável
- Indique explicitamente: "quem ganha" e "quem perde"
- Use bullet points e markdown para organizar
- Se não souber algo específico, seja honesto
- Não constitui recomendação de investimento — mencione isso quando falar de ativos específicos
- Seja conciso mas completo (máx 400 palavras)`,
      add_context_from_internet: true,
    });

    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">FinanceChat</h1>
            <p className="text-xs text-muted-foreground">Assistente de mercado com IA</p>
          </div>
          <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-[10px]">
            <span className="w-1.5 h-1.5 bg-chart-2 rounded-full mr-1 inline-block animate-pulse" />
            Online
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMessages([{
            role: 'assistant',
            content: 'Conversa reiniciada! O que você quer saber sobre o mercado hoje?',
          }])}
          className="text-muted-foreground text-xs gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Nova conversa
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <ReactMarkdown
                  className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                  components={{
                    p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="my-1 ml-4 list-disc space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analisando mercado...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5" /> Sugestões
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => sendMessage(s)}
                disabled={loading}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre qualquer ativo, empresa ou tema do mercado..."
          disabled={loading}
          className="flex-1 h-11"
        />
        <Button type="submit" disabled={loading || !input.trim()} className="h-11 px-4">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Não constitui recomendação de investimento. Consulte um assessor certificado.
      </p>
    </div>
  );
}