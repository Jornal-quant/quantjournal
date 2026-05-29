import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Newspaper, Users, BarChart3, Zap, RefreshCw, Loader2,
  Trash2, Star, Eye, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import GenerateNewsDialog from '../../components/admin/GenerateNewsDialog';
import ProcessingQueue from '../../components/admin/ProcessingQueue';

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

  const { data: subscribers = [] } = useQuery({
    queryKey: ['admin-subs'],
    queryFn: () => base44.entities.NewsletterSubscriber.list('-created_date', 50),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => base44.entities.SystemLog.list('-created_date', 20),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Article.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success('Artigo removido');
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: ({ id, is_featured }) => base44.entities.Article.update(id, { is_featured: !is_featured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    },
  });

  const published = articles.filter((a) => a.status === 'publicado');
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = articles.filter((a) => a.created_date?.startsWith(today)).length;
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  const stats = [
    { label: 'Total de Notícias', value: articles.length, icon: Newspaper, color: 'text-primary' },
    { label: 'Publicadas Hoje', value: todayCount, icon: Zap, color: 'text-accent' },
    { label: 'Assinantes', value: subscribers.length, icon: Users, color: 'text-chart-2' },
    { label: 'Visualizações', value: totalViews, icon: BarChart3, color: 'text-chart-5' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Gerencie seu portal de notícias financeiras</p>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline" size="sm">Ver Site</Button>
            </Link>
            <Button size="sm" onClick={() => setGenerateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Gerar Notícia
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className={`w-8 h-8 ${s.color} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="articles">
          <TabsList>
            <TabsTrigger value="articles">Artigos</TabsTrigger>
            <TabsTrigger value="queue">Fila de Processamento</TabsTrigger>
            <TabsTrigger value="subscribers">Assinantes</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

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
                        <th className="text-left p-3 font-medium">Views</th>
                        <th className="text-left p-3 font-medium">Data</th>
                        <th className="text-right p-3 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((a) => (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-3">
                            <Link to={`/artigo/${a.id}`} className="hover:text-primary font-medium line-clamp-1">
                              {a.title}
                            </Link>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px]">
                              {categoryLabels[a.category] || a.category}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={a.status === 'publicado' ? 'default' : 'secondary'} className="text-[10px]">
                              {a.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{a.views || 0}</td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {a.created_date ? format(new Date(a.created_date), 'dd/MM HH:mm', { locale: ptBR }) : '-'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => toggleFeatured.mutate({ id: a.id, is_featured: a.is_featured })}
                              >
                                <Star className={`w-3.5 h-3.5 ${a.is_featured ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => deleteMutation.mutate(a.id)}
                              >
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

          <TabsContent value="queue" className="mt-4">
            <ProcessingQueue />
          </TabsContent>

          <TabsContent value="subscribers" className="mt-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Plano</th>
                    <th className="text-left p-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="p-3">{s.email}</td>
                      <td className="p-3"><Badge variant="outline" className="text-[10px]">{s.plan}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {s.created_date ? format(new Date(s.created_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </td>
                    </tr>
                  ))}
                  {subscribers.length === 0 && (
                    <tr><td colSpan="3" className="p-6 text-center text-muted-foreground">Nenhum assinante ainda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30">
                  <Badge variant={l.log_type === 'error' ? 'destructive' : l.log_type === 'success' ? 'default' : 'secondary'} className="text-[10px] mt-0.5">
                    {l.log_type}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{l.action}</p>
                    {l.details && <p className="text-xs text-muted-foreground">{l.details}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {l.created_date ? format(new Date(l.created_date), 'HH:mm', { locale: ptBR }) : ''}
                  </span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-center text-muted-foreground py-6">Nenhum log registrado.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <GenerateNewsDialog open={generateOpen} onOpenChange={setGenerateOpen} />
    </div>
  );
}