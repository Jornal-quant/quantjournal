import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Loader2, Instagram, Twitter, MessageCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function SocialPostGenerator({ article }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState(null);
  const articleUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/artigo/${article.id}`
    : '';

  const generate = async () => {
    if (posts) { setOpen(true); return; }
    setLoading(true);
    setOpen(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é especialista em conteúdo financeiro para redes sociais. Com base no artigo abaixo, gere posts prontos para publicação.

Artigo:
Título: ${article.title}
Resumo: ${article.summary || ''}
Conclusão: ${article.conclusion || ''}
Tickers: ${article.tickers || ''}

Gere:
- instagram_caption: legenda para Instagram (3-5 parágrafos, emojis relevantes, 5-8 hashtags no final, call-to-action)
- x_post: post para X/Twitter (máx 280 chars, 2-3 hashtags, impactante)
- telegram_message: mensagem para Telegram/WhatsApp (formato com negrito *assim*, emojis, bullet points com • )
- key_takeaways: 3 insights principais do artigo (frases curtas, uma por linha)

Não inclua URLs. Escreva em português do Brasil. Tom profissional mas acessível.`,
      response_json_schema: {
        type: 'object',
        properties: {
          instagram_caption: { type: 'string' },
          x_post: { type: 'string' },
          telegram_message: { type: 'string' },
          key_takeaways: { type: 'string' },
        },
      },
    });
    setPosts(result);
    setLoading(false);
  };

  const buildXIntentUrl = (text) => {
    const params = new URLSearchParams({
      text,
      url: articleUrl,
    });
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  };

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const openXComposer = () => {
    if (!posts?.x_post) return;
    window.open(buildXIntentUrl(posts.x_post), '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={generate}>
        <Share2 className="w-3 h-3" /> Post Social
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-sm">Posts para Redes Sociais</h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>Fechar</Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Gerando posts com IA...</span>
              </div>
            ) : posts ? (
              <div className="p-5 space-y-5">
                {/* Instagram */}
                {posts.instagram_caption && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600">
                        <Instagram className="w-3.5 h-3.5" /> Instagram
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => copy(posts.instagram_caption, 'Instagram')}>
                        <Copy className="w-3 h-3 mr-1" /> Copiar
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap border border-border/50">
                      {posts.instagram_caption}
                    </div>
                  </div>
                )}
                {/* X/Twitter */}
                {posts.x_post && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Twitter className="w-3.5 h-3.5" /> X / Twitter
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => copy(posts.x_post, 'X/Twitter')}>
                          <Copy className="w-3 h-3 mr-1" /> Copiar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={openXComposer}>
                          <ExternalLink className="w-3 h-3 mr-1" /> Abrir no X
                        </Button>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground/90 leading-relaxed border border-border/50">
                      {posts.x_post}
                      <p className="text-[10px] text-muted-foreground mt-1">{posts.x_post.length}/280 chars</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        O link do artigo será anexado automaticamente no composer.
                      </p>
                    </div>
                  </div>
                )}
                {/* Telegram */}
                {posts.telegram_message && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                        <MessageCircle className="w-3.5 h-3.5" /> Telegram / WhatsApp
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => copy(posts.telegram_message, 'Telegram')}>
                        <Copy className="w-3 h-3 mr-1" /> Copiar
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap border border-border/50">
                      {posts.telegram_message}
                    </div>
                  </div>
                )}
                {/* Key takeaways */}
                {posts.key_takeaways && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-muted-foreground">Key Takeaways</span>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => copy(posts.key_takeaways, 'Key Takeaways')}>
                        <Copy className="w-3 h-3 mr-1" /> Copiar
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap border border-border/50">
                      {posts.key_takeaways}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
