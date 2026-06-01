import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PenLine } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { value: 'bolsa', label: 'Bolsa' },
  { value: 'economia', label: 'Economia' },
  { value: 'dolar', label: 'Câmbio' },
  { value: 'juros', label: 'Juros' },
  { value: 'criptomoedas', label: 'Criptomoedas' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'empresas', label: 'Empresas' },
  { value: 'internacional', label: 'Internacional' },
  { value: 'renda_fixa', label: 'Renda Fixa' },
];

const SENTIMENTS = ['neutro', 'positivo', 'negativo', 'misto'];
const IMPACTS = ['baixo', 'medio', 'alto', 'critico'];
const RELEVANCES = ['baixa', 'media', 'alta', 'urgente'];

function slugify(title) {
  const base = String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'materia';
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

const EMPTY = {
  title: '', category: 'economia', summary: '', what_happened: '', why_it_matters: '',
  conclusion: '', sentiment: 'neutro', impact_level: 'medio', relevance: 'media',
  tickers: '', tags: '', image_url: '', source: 'Redação Capital Times', status: 'publicado',
};

export default function CreateArticleDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setInput = (k) => (e) => set(k)(e.target.value);

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Informe o título.'); return; }
    setLoading(true);
    try {
      await base44.entities.Article.create({
        title: form.title.trim(),
        slug: slugify(form.title),
        category: form.category,
        summary: form.summary.trim(),
        what_happened: form.what_happened.trim(),
        why_it_matters: form.why_it_matters.trim(),
        conclusion: form.conclusion.trim(),
        sentiment: form.sentiment,
        impact_level: form.impact_level,
        relevance: form.relevance,
        tickers: form.tickers.trim(),
        tags: form.tags.trim(),
        image_url: form.image_url.trim(),
        source: form.source.trim() || 'Redação Capital Times',
        status: form.status,
        ai_confidence: 0,
        meta_title: form.title.trim(),
        meta_description: form.summary.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles-home'] });
      toast.success(form.status === 'publicado' ? 'Matéria publicada!' : 'Matéria salva para revisão.');
      setForm(EMPTY);
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || 'Erro ao salvar a matéria.');
    } finally {
      setLoading(false);
    }
  };

  const SelectField = ({ label, value, onChange, options }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value || o} value={o.value || o}>{o.label || (o.charAt(0).toUpperCase() + o.slice(1))}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PenLine className="w-4 h-4" /> Nova matéria (manual)</DialogTitle>
          <DialogDescription>Escreva a matéria do zero. Só o título e a categoria são obrigatórios.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Título *</Label>
            <Input className="mt-1" value={form.title} onChange={setInput('title')} placeholder="Manchete da matéria" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SelectField label="Categoria *" value={form.category} onChange={set('category')} options={categories} />
            <SelectField label="Relevância" value={form.relevance} onChange={set('relevance')} options={RELEVANCES} />
            <SelectField label="Impacto" value={form.impact_level} onChange={set('impact_level')} options={IMPACTS} />
            <SelectField label="Sentimento" value={form.sentiment} onChange={set('sentiment')} options={SENTIMENTS} />
          </div>

          <div>
            <Label className="text-xs">Resumo (chamada)</Label>
            <Textarea className="mt-1" rows={2} value={form.summary} onChange={setInput('summary')} placeholder="Resumo curto que aparece no card e abaixo do título" />
          </div>

          <div>
            <Label className="text-xs">Texto principal</Label>
            <Textarea className="mt-1" rows={8} value={form.what_happened} onChange={setInput('what_happened')} placeholder="Escreva o corpo da matéria. Separe os parágrafos com uma linha em branco." />
          </div>

          <div>
            <Label className="text-xs">Contexto / análise (opcional)</Label>
            <Textarea className="mt-1" rows={4} value={form.why_it_matters} onChange={setInput('why_it_matters')} placeholder="Por que isso importa para o investidor" />
          </div>

          <div>
            <Label className="text-xs">Conclusão (opcional)</Label>
            <Textarea className="mt-1" rows={3} value={form.conclusion} onChange={setInput('conclusion')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tickers (separados por vírgula)</Label>
              <Input className="mt-1" value={form.tickers} onChange={setInput('tickers')} placeholder="PETR4, VALE3" />
            </div>
            <div>
              <Label className="text-xs">Tags (separadas por vírgula)</Label>
              <Input className="mt-1" value={form.tags} onChange={setInput('tags')} placeholder="dividendos, petróleo" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <Label className="text-xs">URL da imagem (opcional)</Label>
              <Input className="mt-1" value={form.image_url} onChange={setInput('image_url')} placeholder="https://... (vazio = capa por categoria)" />
            </div>
            <SelectField label="Status" value={form.status} onChange={set('status')} options={[{ value: 'publicado', label: 'Publicar' }, { value: 'revisao', label: 'Revisão' }]} />
          </div>

          <Button onClick={submit} disabled={loading || !form.title.trim()} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar matéria'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
