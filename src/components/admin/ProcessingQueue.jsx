import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles, Loader2, Clock, ExternalLink,
  CheckCircle2, AlertCircle, Inbox
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProcessingQueue() {
  const [processingIds, setProcessingIds] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['raw-news-queue'],
    queryFn: () => base44.entities.RawNewsFeed.filter({ processed: false }, '-created_date', 50),
    refetchInterval: 15000,
  });

  const handleProcess = async (raw) => {
    setProcessingIds((prev) => new Set(prev).add(raw.id));
    const response = await base44.functions.invoke('processRawNews', { raw_id: raw.id });

    if (response.data?.success) {
      toast.success(`Artigo publicado: ${response.data.title}`);
      queryClient.invalidateQueries({ queryKey: ['raw-news-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    } else {
      toast.error(response.data?.error || 'Erro ao processar');
    }

    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(raw.id);
      return next;
    });
  };

  const handleProcessAll = async () => {
    for (const raw of queue) {
      await handleProcess(raw);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Fila de Processamento</h2>
          <Badge variant="outline">{queue.length} pendentes</Badge>
        </div>
        {queue.length > 1 && (
          <Button
            size="sm"
            onClick={handleProcessAll}
            disabled={processingIds.size > 0}
            className="gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Processar Todos
          </Button>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Fila vazia</p>
          <p className="text-sm mt-1">Nenhuma notícia aguardando processamento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((raw) => {
            const isProcessing = processingIds.has(raw.id);
            return (
              <div
                key={raw.id}
                className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {raw.source_name && (
                      <Badge variant="outline" className="text-[10px]">{raw.source_name}</Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {raw.created_date
                        ? formatDistanceToNow(new Date(raw.created_date), { addSuffix: true, locale: ptBR })
                        : ''}
                    </span>
                  </div>
                  <p className="font-semibold text-sm leading-snug line-clamp-2">{raw.raw_title}</p>
                  {raw.raw_content && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{raw.raw_content}</p>
                  )}
                  {raw.source_url && (
                    <a
                      href={raw.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Ver fonte
                    </a>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleProcess(raw)}
                  disabled={isProcessing}
                  className="shrink-0 gap-1.5"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> Gerar Artigo</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}