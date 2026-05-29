import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewsletterForm() {
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

    await base44.entities.NewsletterSubscriber.create({ email, is_active: true, plan: 'gratuito' });
    setSubscribed(true);
    setLoading(false);
    toast.success('Cadastrado com sucesso!');
  };

  if (subscribed) {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
        <h3 className="font-bold text-lg mb-1">Você está na lista!</h3>
        <p className="text-sm text-muted-foreground">Você receberá as principais notícias do dia.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Newsletter Diária</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Receba o resumo das principais notícias financeiras todos os dias.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? '...' : <ArrowRight className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}