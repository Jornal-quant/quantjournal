import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Zap, RefreshCw, X, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors = {
  pending: 'secondary',
  processing: 'default',
  processed: 'default',
  duplicate: 'outline',
  failed: 'destructive',
  rejected: 'destructive',
};

export default function AdminQueueTab() {
  const [filterStatus, setFilterStatus] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [processingAll, setProcessingAll] = useState(false);
  const queryClient = useQueryClient();

  const { data: rawFeed = [], isLoading } = useQuery({
    queryKey: ['admin-raw-queue'],
    queryFn: () => base44.entities.RawNewsFeed.list('-created_date', 100),
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.RawNewsFeed.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-raw-queue'] }),
  });

  const processOne = async (id) => {
    setProcessingId(id);
    try {
      const res = await base44.functions.invoke('processRawNews', { raw_id: id });
      const data = res.data;
      toast.success(data.auto_published ? `Publicado! Confiança: ${data.ai_confidence}%` : `Enviado para revisão (confiança: ${data.ai_confidence}%)`);
      queryClient.invalidateQueries();
    } catch (e) {
      toast.error('Erro ao processar');
    }
    setProcessingId(null);
  };

  const processAll = async () => {
    const pending = rawFeed.filter((r) => r.status === 'pending');
    if (pending.length === 0) { toast.info('Nenhum item pendente'); return; }
    setProcessingAll(true);
    let done = 0;
    for (const item of pending.slice(0, 5)) {
      await base44.functions.invoke('processRawNews', { raw_id: item.id }).catch(() => {});
      done++;
    }
    queryClient.invalidateQueries();
    toast.success(`${done} notícias processadas`);
    setProcessingAll(false);
  };

  const filtered = filterStatus === 'all' ? rawFeed : rawFeed.filter((r) => r.status === filterStatus);
  const statusCounts = rawFeed.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'processing', 'processed', 'failed', 'rejected', 'duplicate'].map((s) => (
            <Button key={s} size="sm" variant={filterStatus === s ? 'default' : 'outline'} className="h-7 text-xs"
              onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'Todos' : s}
              {statusCounts[s] > 0 && <span className="ml-1 text-[10px]">({statusCounts[s]})</span>}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-raw-queue'] })}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar
          </Button>
          <Button size="sm" onClick={processAll} disabled={processingAll}>
            {processingAll ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
            Processar Pendentes
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Nenhum item neste status.</p>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium">Título</th>
                <th className="text-left p-3 font-medium">Fonte</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Tempo</th>
                <th className="text-right p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-3 max-w-xs">
                    <p className="font-medium line-clamp-2 text-sm">{item.raw_title}</p>
                    {item.category_hint && <span className="text-[10px] text-muted-foreground capitalize">{item.category_hint}</span>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{item.source_name || '—'}</td>
                  <td className="p-3">
                    <Badge variant={statusColors[item.status] || 'outline'} className="text-[10px]">{item.status}</Badge>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {item.created_date ? formatDistanceToNow(new Date(item.created_date), { addSuffix: true, locale: ptBR }) : '—'}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.source_url && (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
                        </a>
                      )}
                      {item.status === 'pending' && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => processOne(item.id)}
                          disabled={processingId === item.id}>
                          {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />}
                          {processingId === item.id ? '' : 'Processar'}
                        </Button>
                      )}
                      {(item.status === 'pending' || item.status === 'failed') && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => updateStatus.mutate({ id: item.id, status: 'rejected' })}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {item.status === 'pending' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                          onClick={() => updateStatus.mutate({ id: item.id, status: 'duplicate' })}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}