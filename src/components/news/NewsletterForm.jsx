import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const exists = await base44.entities.NewsletterSubscriber.filter({ email });
      if (!exists.length) {
        await base44.entities.NewsletterSubscriber.create({ email, confirmed: false, plan: 'free', is_active: true });
      }
      setDone(true);
    } catch {
      setError('Não foi possível concluir a inscrição. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="border border-foreground/8 rounded-xl p-4 text-center" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-400">✓ Inscrito</span>
        <p className="font-sans text-[12px] text-foreground/55 mt-1">Você receberá o briefing diário.</p>
      </div>
    );
  }

  return (
    <div className="border border-foreground/8 rounded-xl p-4" style={{ backgroundColor: 'hsl(var(--card))' }}>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-foreground/55 mb-1">Morning Brief</p>
      <p className="font-sans text-[12px] text-foreground/50 mb-3 leading-relaxed">
        Receba o resumo do mercado antes da abertura.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full font-mono text-[12px] px-3 py-2.5 rounded-lg border border-foreground/8 bg-foreground/4 text-foreground/70 placeholder:text-foreground/20 outline-none focus:border-foreground/20 transition-colors duration-150"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full font-mono text-[11px] font-semibold uppercase tracking-wider bg-white text-black py-2.5 rounded-lg hover:bg-foreground/90 transition-colors duration-150 disabled:opacity-40 cursor-pointer">
          {loading ? 'Aguarde…' : 'Inscrever-se →'}
        </button>
        {error && (
          <p className="font-sans text-[11px] text-ds-dn leading-relaxed" role="alert">{error}</p>
        )}
      </form>
    </div>
  );
}