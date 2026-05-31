import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Download, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const TOTAL_TOPICS = 120;
const BATCH_SIZE = 5;

export default function BackfillPanel() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(0);
  const [log, setLog] = useState([]);
  const [done, setDone] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const queryClient = useQueryClient();

  const addLog = (msg, type = 'info') => {
    setLog((prev) => [...prev.slice(-19), { msg, type, ts: new Date().toLocaleTimeString('pt-BR') }]);
  };

  const runBackfill = async () => {
    setRunning(true);
    setDone(false);
    setProgress(0);
    setGenerated(0);
    setLog([]);
    addLog('Iniciando backfill de 120 notícias...', 'info');

    let index = 0;
    let totalGenerated = 0;

    while (index < TOTAL_TOPICS) {
      try {
        addLog(`Gerando lote ${Math.floor(index / BATCH_SIZE) + 1}/${Math.ceil(TOTAL_TOPICS / BATCH_SIZE)} (tópicos ${index + 1}–${Math.min(index + BATCH_SIZE, TOTAL_TOPICS)})...`, 'info');
        const res = await base44.functions.invoke('backfillNews', {
          batch_size: BATCH_SIZE,
          start_index: index,
        });
        const data = res.data;
        totalGenerated += data.generated || 0;
        setGenerated(totalGenerated);
        setProgress(Math.round(((index + BATCH_SIZE) / TOTAL_TOPICS) * 100));
        addLog(`✓ Lote concluído: ${data.generated} artigos gerados`, 'success');

        if (!data.has_more) break;
        index += BATCH_SIZE;

        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        addLog(`✗ Erro no lote ${index}: ${err.message}`, 'error');
        index += BATCH_SIZE; // skip and continue
      }
    }

    setProgress(100);
    setDone(true);
    setRunning(false);
    queryClient.invalidateQueries();
    toast.success(`Backfill concluído! ${totalGenerated} artigos gerados.`);
    addLog(`✅ Backfill finalizado! ${totalGenerated} artigos criados.`, 'success');
  };

  const collectNow = async () => {
    setCollecting(true);
    try {
      addLog('Buscando novas notícias dos feeds RSS...', 'info');
      const res = await base44.functions.invoke('collectLatestNews', { auto_process: true });
      const data = res.data;
      addLog(`✓ Coleta: ${data.collected} novas | ${data.duplicates} duplicadas | ${data.processed} processadas`, 'success');
      queryClient.invalidateQueries();
      toast.success(`${data.collected} novas notícias coletadas!`);
    } catch (err) {
      addLog(`✗ Erro na coleta: ${err.message}`, 'error');
      toast.error('Erro ao coletar notícias');
    }
    setCollecting(false);
  };

  const processQueue = async () => {
    try {
      addLog('Processando fila de pendentes...', 'info');
      const res = await base44.functions.invoke('processRawNews', {});
      const data = res.data;
      addLog(`✓ Processado: ${data.message || 'concluído'}`, 'success');
      queryClient.invalidateQueries();
      toast.success('Fila processada!');
    } catch (err) {
      addLog(`✗ Erro: ${err.message}`, 'error');
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div>
        <h3 className="font-bold text-lg mb-1">Gerenciamento de Conteúdo</h3>
        <p className="text-sm text-muted-foreground">Preencha o portal com notícias ou atualize manualmente.</p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">Buscar Notícias Antigas</p>
          </div>
          <p className="text-xs text-muted-foreground">Gera ~120 artigos sobre temas financeiros via IA com internet. Ideal para preencher o portal do zero.</p>
          <Button className="w-full" size="sm" onClick={runBackfill} disabled={running || collecting}>
            {running ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Gerando...</> : <><Download className="w-3.5 h-3.5 mr-1" />Iniciar Backfill</>}
          </Button>
        </div>

        <div className="border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-chart-2" />
            <p className="font-semibold text-sm">Atualizar Notícias Agora</p>
          </div>
          <p className="text-xs text-muted-foreground">Busca notícias recentes dos feeds RSS e processa automaticamente as mais relevantes.</p>
          <Button className="w-full" size="sm" variant="outline" onClick={collectNow} disabled={running || collecting}>
            {collecting ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Coletando...</> : <><RefreshCw className="w-3.5 h-3.5 mr-1" />Coletar RSS</>}
          </Button>
        </div>

        <div className="border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <p className="font-semibold text-sm">Processar Fila</p>
          </div>
          <p className="text-xs text-muted-foreground">Processa a próxima notícia pendente na fila com IA e publica ou envia para revisão.</p>
          <Button className="w-full" size="sm" variant="outline" onClick={processQueue} disabled={running}>
            <Zap className="w-3.5 h-3.5 mr-1" />Processar Próxima
          </Button>
        </div>
      </div>

      {/* Progress */}
      {(running || done) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{done ? '✅ Concluído' : 'Gerando artigos...'}</span>
            <span className="text-muted-foreground">{generated} artigos / {progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
          {log.map((l, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground flex-shrink-0">{l.ts}</span>
              <span className={l.type === 'error' ? 'text-destructive' : l.type === 'success' ? 'text-chart-2' : 'text-foreground/85'}>
                {l.msg}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}