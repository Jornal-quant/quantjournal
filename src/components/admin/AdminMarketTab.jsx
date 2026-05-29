import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeColors = {
  index: 'bg-primary/10 text-primary',
  fx: 'bg-chart-4/10 text-chart-4',
  crypto: 'bg-accent/10 text-accent',
  commodity: 'bg-chart-3/10 text-chart-3',
  rate: 'bg-chart-2/10 text-chart-2',
};

export default function AdminMarketTab() {
  const queryClient = useQueryClient();

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['admin-market'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
  });

  const handleUpdate = async () => {
    toast.info('Atualizando cotações com IA...');
    try {
      await base44.functions.invoke('updateMarketSnapshots', {});
      queryClient.invalidateQueries();
      toast.success('Cotações atualizadas!');
    } catch {
      toast.error('Erro ao atualizar cotações');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{snapshots.length} ativos monitorados</p>
        <Button size="sm" onClick={handleUpdate}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar Cotações IA
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {snapshots.map((s) => {
            const up = s.change_percent > 0;
            const neutral = s.change_percent === 0;
            return (
              <div key={s.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-lg">{s.name}</p>
                    <Badge className={`text-[10px] ${typeColors[s.market_type] || ''}`}>{s.market_type}</Badge>
                  </div>
                  {neutral ? <Minus className="w-5 h-5 text-muted-foreground" />
                    : up ? <TrendingUp className="w-5 h-5 text-chart-2" />
                    : <TrendingDown className="w-5 h-5 text-destructive" />}
                </div>
                <p className="text-2xl font-bold">{s.price?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</p>
                <p className={`text-sm font-medium ${neutral ? 'text-muted-foreground' : up ? 'text-chart-2' : 'text-destructive'}`}>
                  {s.change_percent > 0 ? '+' : ''}{s.change_percent?.toFixed(2)}%
                </p>
                {s.updated_at && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true, locale: ptBR })}
                  </p>
                )}
              </div>
            );
          })}
          {snapshots.length === 0 && (
            <div className="col-span-3 p-10 text-center text-muted-foreground">
              <p>Nenhuma cotação ainda. Clique em "Atualizar Cotações IA" para buscar dados atuais.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}