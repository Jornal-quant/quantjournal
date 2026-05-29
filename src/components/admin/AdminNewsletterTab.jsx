import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NEWSLETTER_TYPES = [
  { value: 'morning_brief', label: '☀️ Morning Brief', description: 'Resumo matinal do mercado' },
  { value: 'market_close', label: '🔔 Fechamento de Mercado', description: 'Análise do fechamento' },
  { value: 'breaking_news', label: '🚨 Breaking News', description: 'Notícia urgente' },
];

export default function AdminNewsletterTab({ subscribers }) {
  const [sending, setSending] = useState(false);
  const [type, setType] = useState('morning_brief');

  const free = subscribers.filter((s) => s.plan === 'free' && s.is_active !== false);
  const premium = subscribers.filter((s) => s.plan === 'premium' && s.is_active !== false);

  const handleSend = async () => {
    setSending(true);
    try {
      await base44.functions.invoke('sendDailyNewsletter', { type });
      toast.success('Newsletter disparada com sucesso!');
    } catch {
      toast.error('Erro ao enviar newsletter');
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">Total</p>
          </div>
          <p className="text-3xl font-bold">{subscribers.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-chart-2" />
            <p className="text-sm font-medium">Free</p>
          </div>
          <p className="text-3xl font-bold">{free.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-accent" />
            <p className="text-sm font-medium">Premium</p>
          </div>
          <p className="text-3xl font-bold">{premium.length}</p>
        </div>
      </div>

      {/* Dispatch */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-bold mb-3">Disparar Newsletter Manualmente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {NEWSLETTER_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`text-left p-3 rounded-lg border-2 transition-colors ${
                type === t.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              }`}
            >
              <p className="font-medium text-sm">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>
        <Button onClick={handleSend} disabled={sending} className="w-full sm:w-auto">
          {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          {sending ? 'Enviando...' : 'Disparar Newsletter'}
        </Button>
      </div>

      {/* Subscriber list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Plano</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="p-3 font-medium">{s.email}</td>
                <td className="p-3">
                  <Badge variant={s.plan === 'premium' ? 'default' : 'secondary'} className="text-[10px]">{s.plan}</Badge>
                </td>
                <td className="p-3">
                  <Badge variant={s.is_active !== false ? 'outline' : 'destructive'} className="text-[10px]">
                    {s.is_active !== false ? 'ativo' : 'inativo'}
                  </Badge>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {s.created_date ? format(new Date(s.created_date), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr><td colSpan="4" className="p-6 text-center text-muted-foreground">Nenhum assinante ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}