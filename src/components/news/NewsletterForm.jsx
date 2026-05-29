import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function NewsletterForm({ compact = false }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const existing = await base44.entities.NewsletterSubscriber.filter({ email });
    if (existing.length > 0) {
      toast.info('Este e-mail já está cadastrado.');
      setLoading(false);
      return;
    }
    await base44.entities.NewsletterSubscriber.create({ email, is_active: true, plan: 'free' });
    setSubscribed(true);
    setLoading(false);
    toast.success('Cadastrado com sucesso!');
  };

  if (subscribed) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
        <p className="font-bold text-sm text-emerald-700">Você está na lista!</p>
        <p className="text-xs text-emerald-600 mt-1">Receba o resumo do mercado todo dia.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-foreground rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4 text-background/60" />
          <p className="text-sm font-bold text-background">Newsletter Diária</p>
        </div>
        <p className="text-xs text-background/50 mb-3">Resumo das principais notícias financeiras direto no seu e-mail.</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input type="email" placeholder="seu@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-background/10 border-background/20 text-background placeholder:text-background/30 h-8 text-xs"
            required />
          <Button type="submit" disabled={loading} size="sm" className="h-8 bg-primary text-primary-foreground shrink-0">
            {loading ? '...' : <ArrowRight className="w-3.5 h-3.5" />}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-foreground rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4 text-background/60" />
        <h3 className="font-bold text-background">Newsletter do Mercado</h3>
      </div>
      <p className="text-xs text-background/50 mb-4 leading-relaxed">
        Análise das principais notícias financeiras. Toda manhã, antes do pregão.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input type="email" placeholder="seu@email.com" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-background/10 border-background/20 text-background placeholder:text-background/30 text-sm"
          required />
        <Button type="submit" disabled={loading} className="shrink-0 bg-primary text-primary-foreground">
          {loading ? '...' : 'Assinar'}
        </Button>
      </form>
      <p className="text-[10px] text-background/30 mt-2">Gratuito. Sem spam. Cancele quando quiser.</p>
    </div>
  );
}