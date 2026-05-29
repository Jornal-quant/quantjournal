import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { value: 'bolsa', label: 'Bolsa' },
  { value: 'economia', label: 'Economia' },
  { value: 'dolar', label: 'Dólar' },
  { value: 'juros', label: 'Juros' },
  { value: 'criptomoedas', label: 'Criptomoedas' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'empresas', label: 'Empresas' },
  { value: 'internacional', label: 'Internacional' },
  { value: 'renda_fixa', label: 'Renda Fixa' },
];

export default function GenerateNewsDialog({ open, onOpenChange }) {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('economia');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);

    const categoryLabel = categories.find(c => c.value === category)?.label || category;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um jornalista financeiro sênior. Gere um artigo completo sobre: "${topic}".
Categoria: ${categoryLabel}.

Pesquise informações atualizadas na internet para gerar conteúdo preciso e atual.

Retorne um JSON com:
- title: título SEO (máx 80 chars)
- slug: URL amigável
- summary: resumo executivo (2-3 frases)
- what_happened: explicação objetiva do que aconteceu (2-3 parágrafos)
- why_it_matters: por que isso importa para investidores (1-2 parágrafos)
- impacts: objeto JSON com chaves como "Bolsa", "Dólar", "Juros", "Cripto" etc, cada valor é uma frase descrevendo o impacto
- affected_companies: empresas afetadas separadas por vírgula
- tickers: tickers relacionados separados por vírgula
- conclusion: conclusão resumida
- tags: keywords SEO separadas por vírgula
- meta_title: meta title SEO
- meta_description: meta description SEO (máx 160 chars)
- relevance: "baixa", "media", "alta" ou "urgente"
- country: país principal
- sector: setor econômico
- source: fonte provável da notícia`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          summary: { type: 'string' },
          what_happened: { type: 'string' },
          why_it_matters: { type: 'string' },
          impacts: { type: 'object' },
          affected_companies: { type: 'string' },
          tickers: { type: 'string' },
          conclusion: { type: 'string' },
          tags: { type: 'string' },
          meta_title: { type: 'string' },
          meta_description: { type: 'string' },
          relevance: { type: 'string' },
          country: { type: 'string' },
          sector: { type: 'string' },
          source: { type: 'string' },
        },
      },
    });

    await base44.entities.Article.create({
      ...result,
      impacts: JSON.stringify(result.impacts || {}),
      category,
      status: 'publicado',
      is_featured: result.relevance === 'urgente' || result.relevance === 'alta',
      views: 0,
    });

    await base44.entities.SystemLog.create({
      action: `Artigo gerado: ${result.title}`,
      details: `Categoria: ${categoryLabel}, Relevância: ${result.relevance}`,
      log_type: 'success',
      source: 'IA',
    });

    queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    queryClient.invalidateQueries({ queryKey: ['articles-home'] });
    toast.success('Artigo gerado e publicado!');
    setLoading(false);
    setTopic('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerar Notícia com IA
          </DialogTitle>
          <DialogDescription>
            Insira um tema e a IA irá pesquisar e gerar um artigo completo automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Tema / Assunto</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Fed mantém juros, impactos no mercado brasileiro"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando artigo...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Artigo
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}