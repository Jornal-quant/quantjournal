import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Lock, Loader2 } from 'lucide-react';

const TOKEN_KEY = 'qj_admin_token';

export function clearAdminToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

// Porta de acesso ao /admin: exige e-mail + senha validados no servidor
// (função adminLogin lê ADMIN_EMAIL/ADMIN_PASSWORD das envs — não ficam no
// bundle). Guarda o token de sessão no localStorage.
export default function AdminGate({ children }) {
  const [authed, setAuthed] = useState(() => {
    try { return !!localStorage.getItem(TOKEN_KEY); } catch { return false; }
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authed) return children;

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('adminLogin', { email, password });
      const data = res?.data || res;
      if (data?.success && data?.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setAuthed(true);
      } else {
        setError(data?.error || 'E-mail ou senha inválidos.');
      }
    } catch (err) {
      setError(err?.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <form onSubmit={submit} className="w-full max-w-sm border border-ds-border rounded-xl p-6 bg-ds-surface">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <Lock className="w-4 h-4 text-background" />
          </div>
          <div>
            <p className="font-mono text-sm font-semibold">Área administrativa</p>
            <p className="font-mono text-[10px] text-muted-foreground">Acesso restrito</p>
          </div>
        </div>

        <label className="block mb-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">E-mail</span>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username"
            className="mt-1 w-full font-mono text-sm px-3 py-2 bg-ds-surface2 border border-ds-border rounded outline-none focus:border-foreground transition-colors"
          />
        </label>
        <label className="block mb-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Senha</span>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
            className="mt-1 w-full font-mono text-sm px-3 py-2 bg-ds-surface2 border border-ds-border rounded outline-none focus:border-foreground transition-colors"
          />
        </label>

        {error && <p className="font-mono text-[11px] text-ds-dn mb-3">{error}</p>}

        <button
          type="submit" disabled={loading || !email || !password}
          className="w-full flex items-center justify-center gap-2 font-mono text-sm font-semibold bg-foreground text-background py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-40">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
