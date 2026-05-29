import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Newspaper, Users, BarChart3, Zap, Loader2, Trash2, Star,
  Plus, RefreshCw, Globe, Activity, CheckCircle, AlertCircle,
  Clock, TrendingUp, Send, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { format, subHours, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import GenerateNewsDialog from '../../components/admin/GenerateNewsDialog';
import AdminQueueTab from '../../components/admin/AdminQueueTab';
import AdminSourcesTab from '../../components/admin/AdminSourcesTab';
import AdminMarketTab from '../../components/admin/AdminMarketTab';
import AdminNewsletterTab from '../../components/admin/AdminNewsletterTab';

const categoryLabels = {
  bolsa: 'Bolsa', renda_fixa: 'Renda Fixa', juros: 'Juros', dolar: 'Dólar',
  economia: 'Economia', criptomoedas: 'Cripto', commodities: 'Commodities',
  empresas: 'Empresas', internacional: 'Internacional',
};

export default function AdminDashboard() {
  const [generateOpen, setGenerateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ['admin-articles'],
    queryFn: () => base44.entities.Article.list('-created_date', 100),
  });
  const { data: rawFeed = [] } = useQuery({
    queryKey: ['admin-raw'],
    queryFn: () => base44.entities.RawNewsFeed.list('-created_date', 200),
  });
  const { data: sources = [] } = useQuery({
    queryKey: ['admin-sources'],
    queryFn: () => base44.entities.NewsSource.list(),
  });
  const { data: subscribers = [] } = useQuery({
    queryKey: ['admin-subs'],
    queryFn: () => base44.entities.NewsletterSubscriber.list('-created_date', 100),
  });
  const { data: logs = [] } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => base44.entities.SystemLog.list('-created_date', 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Article.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-articles'] }); toast.success('Artigo removido'); },
  });
  const toggleFeatured = useMutation({
    mutationFn: ({ id, is_featured }) => base44.entities.Article.update(id, { is_featured: !is_featured }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-articles'] }),
  });
  const publishMutation = useMutation({
    mutationFn: (id) => base44.entities.Article.update(id, { status: 'publicado' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-articles'] }); toast.success('Artigo publicado'); },
  });

  // Metrics
  const today = new Date().toISOString().slice(0, 10);
  const last24h = subHours(new Date(), 24);
  const todayArticles = articles.filter((a) => a.created_date?.startsWith(today));
  const pendingQueue = rawFeed.filter((r) => r.status === 'pending');
  const recentErrors = logs.filter((l) => l.log_type === 'error' && isAfter(new Date(l.created_date || 0), last24h));
  const publishedToday = todayArticles.filter((a) => a.status === 'publicado');
  const reviewArticles = articles.filter((a) => a.status === 'revisao');
  const avgConfidence = articles.filter((a) => a.ai_confidence > 0).length > 0
    ? Math.round(articles.filter((a) => a.ai_confidence > 0).reduce((s, a) => s + (a.ai_confidence || 0), 0) / articles.filter((a) => a.ai_confidence > 0).length)
    : 0;
  const publishRate = rawFeed.length > 0 ? Math.round((rawFeed.filter((r) => r.status === 'processed').length / rawFeed.length) * 100) : 0;

  const stats = [
    { label: 'Fontes Ativas', value: sources.filter((s) => s.is_active).length, icon: Globe, color: 'text-primary' },
    { label: 'Coletadas Hoje', value: rawFeed.filter((r) => r.created_date?.startsWith(today)).length, icon: Activity, color: 'text-chart-2' },
    { label: 'Publicadas Hoje', value: publishedToday.length, icon: Zap, color: 'text-accent' },
    { label: 'Pendentes na Fila', value: pendingQueue.length, icon: Clock, color: 'text-chart-4' },
    { label: 'Em Revisão', value: reviewArticles.length, icon: AlertCircle, color: 'text-destructive' },
    { label: 'Erros 24h', value: recentErrors.length, icon: AlertCircle, color: 'text-destructive' },
    { label: 'Confiança Média IA', value: avgConfidence ? `${avgConfidence}%` : '—', icon: TrendingUp, color: 'text-chart-5' },
    { label: 'Taxa de Publicação', value: publishRate ? `${publishRate}%` : '—', icon: BarChart3, color: 'text-chart-2' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-display">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">QuantJournal / FinanceNews AI</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={async () => {
              toast.info('Coletando fontes...');
              await base44.functions.invoke('collectNewsSources', {});
              queryClient.invalidateQueries();
              toast.success('Coleta concluída!');
            }}>
              <RefreshCw className="w-4 h-4 mr-1" /> Coletar Fontes
            </Button>
            <Link to="/"><Button variant="outline" size="sm">Ver Site</Button></Link>
            <Button size="sm" onClick={() => setGenerateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Gerar Notícia IA
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className={`w-7 h-7 ${s.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="articles">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="articles">Artigos</TabsTrigger>
            <TabsTrigger value="queue">Fila {pendingQueue.length > 0 && <Badge className="ml-1 text-[9px] px-1 py-0">{pendingQueue.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="review">Revisão {reviewArticles.length > 0 && <Badge variant="destructive" className="ml-1 text-[9px] px-1 py-0">{reviewArticles.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="sources">Fontes</TabsTrigger>
            <TabsTrigger value="market">Mercado</TabsTrigger>
            <TabsTrigger value="subscribers">Newsletter</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* ARTICLES */}
          <TabsContent value="articles" className="mt-4">
            {loadingArticles ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium">Título</th>
                        <th className="text-left p-3 font-medium">Categoria</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">IA%</th>
                        <th className="text-left p-3 font-medium">Views</th>
                        <th className="text-left p-3 font-medium">Data</th>
                        <th className="text-right p-3 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.filter((a) => a.status !== 'revisao').map((a) => (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-3 max-w-xs">
                            <Link to={`/artigo/${a.id}`} className="hover:text-primary font-medium line-clamp-1 text-sm">{a.title}</Link>
                          </td>
                          <td className="p-3"><Badge variant="outline" className="text-[10px]">{categoryLabels[a.category] || a.category}</Badge></td>
                          <td className="p-3"><Badge variant={a.status === 'publicado' ? 'default' : 'secondary'} className="text-[10px]">{a.status}</Badge></td>
                          <td className="p-3 text-xs text-muted-foreground">{a.ai_confidence ? `${a.ai_confidence}%` : '—'}</td>
                          <td className="p-3 text-xs text-muted-foreground">{a.views || 0}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {a.created_date ? format(new Date(a.created_date), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => toggleFeatured.mutate({ id: a.id, is_featured: a.is_featured })}>
                                <Star className={`w-3.5 h-3.5 ${a.is_featured ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                onClick={() => deleteMutation.mutate(a.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* QUEUE */}
          <TabsContent value="queue" className="mt-4">
            <AdminQueueTab />
          </TabsContent>

          {/* REVIEW */}
          <TabsContent value="review" className="mt-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {reviewArticles.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">Nenhum artigo aguardando revisão.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-medium">Título</th>
                      <th className="text-left p-3 font-medium">Confiança IA</th>
                      <th className="text-left p-3 font-medium">Fonte</th>
                      <th className="text-right p-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewArticles.map((a) => (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 max-w-xs">
                          <Link to={`/artigo/${a.id}`} className="hover:text-primary font-medium line-clamp-2 text-sm">{a.title}</Link>
                        </td>
                        <td className="p-3">
                          <Badge variant={a.ai_confidence >= 65 ? 'default' : 'destructive'} className="text-[10px]">
                            {a.ai_confidence || 0}%
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{a.source || '—'}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" className="h-7 text-xs" onClick={() => publishMutation.mutate(a.id)}>
                              <CheckCircle className="w-3 h-3 mr-1" /> Publicar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
                              onClick={() => deleteMutation.mutate(a.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* SOURCES */}
          <TabsContent value="sources" className="mt-4">
            <AdminSourcesTab />
          </TabsContent>

          {/* MARKET */}
          <TabsContent value="market" className="mt-4">
            <AdminMarketTab />
          </TabsContent>

          {/* NEWSLETTER */}
          <TabsContent value="subscribers" className="mt-4">
            <AdminNewsletterTab subscribers={subscribers} />
          </TabsContent>

          {/* LOGS */}
          <TabsContent value="logs" className="mt-4">
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30">
                  <Badge
                    variant={l.log_type === 'error' ? 'destructive' : l.log_type === 'success' ? 'default' : 'secondary'}
                    className="text-[10px] mt-0.5 flex-shrink-0"
                  >
                    {l.log_type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{l.action}</p>
                    {l.details && <p className="text-xs text-muted-foreground truncate">{l.details}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {l.created_date ? format(new Date(l.created_date), 'dd/MM HH:mm', { locale: ptBR }) : ''}
                  </span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-center text-muted-foreground py-6">Nenhum log.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <GenerateNewsDialog open={generateOpen} onOpenChange={setGenerateOpen} />
    </div>
  );
}