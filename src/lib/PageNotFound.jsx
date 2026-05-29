import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-ds-surface">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="font-mono text-6xl font-semibold text-foreground/10">404</div>
                <div className="space-y-2">
                    <h1 className="font-mono text-xl font-semibold">Página não encontrada</h1>
                    <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                        A página <span className="font-mono font-medium text-foreground/70">/{pageName}</span> não existe ou foi removida.
                    </p>
                </div>
                {isFetched && authData?.isAuthenticated && authData?.user?.role === 'admin' && (
                    <div className="p-3 bg-ds-surface2 border border-ds-border rounded text-left">
                        <p className="font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Admin</p>
                        <p className="font-sans text-xs text-muted-foreground">Esta página pode ainda não ter sido implementada. Peça ao assistente para criá-la.</p>
                    </div>
                )}
                <div className="flex items-center justify-center gap-3">
                    <button onClick={() => window.location.href = '/'}
                        className="font-mono text-sm font-semibold bg-foreground text-background px-5 py-2.5 rounded hover:opacity-90 transition-opacity">
                        ← Voltar ao início
                    </button>
                    <a href="/busca" className="font-mono text-sm text-muted-foreground border border-ds-border px-5 py-2.5 rounded hover:bg-ds-surface2 hover:text-foreground transition-colors">
                        Buscar
                    </a>
                </div>
            </div>
        </div>
    )
}