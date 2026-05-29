import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, RefreshCw, Globe, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminSourcesTab() {
  const [showAdd, setShowAdd] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', type: 'rss', category: 'economia', country: 'BR', priority: 5 });
  const queryClient = useQueryClient();

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['admin-sources-tab'],
    queryFn: () => base44.entities.NewsSource.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NewsSource.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-sources-tab'] }); toast.success('Fonte removida'); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.NewsSource.update(id, { is_active: !is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-sources-tab'] }),
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.NewsSource.create({ ...data, is_active: true, error_count: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sources-tab'] });
      setShowAdd(false);
      setNewSource({ name: '', url: '', type: 'rss', category: 'economia', country: 'BR', priority: 5 });
      toast.success('Fonte adicionada');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">{sources.filter((s) => s.is_active).length} fontes ativas de {sources.length} total</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={async () => {
            toast.info('Inicializando fontes padrão...');
            await base44.functions.invoke('collectNewsSources', {});
            queryClient.invalidateQueries();
            toast.success('Concluído!');
          }}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Coletar Agora
          </Button>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Fonte
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 gap-3">
          <Input placeholder="Nome da fonte" value={newSource.name} onChange={(e) => setNewSource({ ...newSource, name: e.target.value })} />
          <Input placeholder="URL do RSS/API" value={newSource.url} onChange={(e) => setNewSource({ ...newSource, url: e.target.value })} />
          <select className="border border-border rounded-md px-3 py-2 text-sm bg-background"
            value={newSource.type} onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}>
            <option value="rss">RSS</option>
            <option value="api">API</option>
            <option value="website">Website</option>
            <option value="filing">Filing</option>
            <option value="central_bank">Banco Central</option>
          </select>
          <select className="border border-border rounded-md px-3 py-2 text-sm bg-background"
            value={newSource.category} onChange={(e) => setNewSource({ ...newSource, category: e.target.value })}>
            {['economia', 'bolsa', 'dolar', 'juros', 'empresas', 'criptomoedas', 'internacional', 'commodities'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => addMutation.mutate(newSource)} disabled={!newSource.name || !newSource.url}>
              Salvar
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium">Fonte</th>
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Categoria</th>
                <th className="text-left p-3 font-medium">Última Coleta</th>
                <th className="text-left p-3 font-medium">Erros</th>
                <th className="text-right p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-xs">{s.url}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><Badge variant="outline" className="text-[10px]">{s.type}</Badge></td>
                  <td className="p-3 text-xs capitalize text-muted-foreground">{s.category || '—'}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {s.last_checked_at ? formatDistanceToNow(new Date(s.last_checked_at), { addSuffix: true, locale: ptBR }) : 'Nunca'}
                  </td>
                  <td className="p-3">
                    {(s.error_count || 0) > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3" />{s.error_count}
                      </span>
                    ) : <span className="text-xs text-chart-2">0</span>}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => toggleMutation.mutate({ id: s.id, is_active: s.is_active })}>
                        {s.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => deleteMutation.mutate(s.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-muted-foreground">Clique em "Coletar Agora" para inicializar as fontes padrão.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}