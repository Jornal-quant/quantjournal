import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function NewsletterForm({ compact = false }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const exists = await base44.entities.NewsletterSubscriber.filter({ email });
    if (!exists.length) {
      await base44.entities.NewsletterSubscriber.create({ email, confirmed: false, plan: 'free', is_active: true });
    }
    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="border border-ds-border rounded-lg p-4 bg-ds-surface text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ds-up font-semibold mb-1">✓ Inscrito!</p>
        <p className="font-sans text-xs text-muted-foreground">Você receberá o briefing diário.</p>
      </div>
    );
  }

  return (
    <div className="border border-ds-border rounded-lg p-4 bg-ds-surface">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Morning Brief</p>
      <p className="font-sans text-xs text-muted-foreground mb-3 leading-relaxed">
        Receba o resumo do mercado antes da abertura.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full font-mono text-xs px-3 py-2.5 bg-ds-surface2 border border-ds-border rounded outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full font-mono text-[11px] font-semibold uppercase tracking-wider bg-foreground text-background py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-40">
          {loading ? 'Aguarde...' : 'Inscrever-se →'}
        </button>
      </form>
    </div>
  );
}