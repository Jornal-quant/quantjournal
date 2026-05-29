import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Globe, Brain, RefreshCw, BarChart3, AlertTriangle, ChevronRight } from 'lucide-react';

const SECTIONS = [
  {
    icon: Globe,
    title: 'Como coletamos informações',
    content: `O FinAI Pulse monitora fontes públicas e licenciadas do mercado financeiro, incluindo agências de notícias, sites de finanças, relatórios de bancos centrais, comunicados de empresas listadas e dados de mercado. A coleta é realizada de forma automatizada por crawlers e integrações com APIs de terceiros, com frequência configurável por fonte.

Cada notícia coletada é armazenada com metadados de origem: URL, data de publicação, fonte e um identificador único para controle de duplicidade.`,
  },
  {
    icon: Brain,
    title: 'Como a IA gera análises',
    content: `O sistema utiliza modelos de linguagem (LLMs) para processar o conteúdo coletado e gerar análises estruturadas. O processo inclui:

1. Triagem de relevância: a IA avalia se a notícia tem impacto relevante para investidores brasileiros.
2. Extração de entidades: identificação de empresas, tickers, indicadores e eventos-chave.
3. Geração de resumo: produção de texto analítico em português, respeitando diretrizes editoriais.
4. Classificação de sentimento e impacto: baseada no conteúdo e contexto da notícia.

As análises seguem um conjunto de instruções que proíbem linguagem de recomendação financeira e exigem embasamento factual.`,
  },
  {
    icon: RefreshCw,
    title: 'Como evitamos duplicidade',
    content: `Cada notícia coletada passa por um processo de verificação de duplicidade baseado em:

- Hash do conteúdo principal
- Comparação semântica com artigos já publicados
- Identificador externo da fonte original

Quando múltiplas fontes cobrem o mesmo evento, o sistema agrupa as notícias em um único evento e gera um artigo consolidado, citando todas as fontes relevantes.`,
  },
  {
    icon: RefreshCw,
    title: 'Como atualizamos artigos',
    content: `Artigos podem ser atualizados automaticamente quando novas informações relevantes são identificadas sobre o mesmo evento. Cada atualização é registrada com data e hora, mantendo um histórico de versões visível ao leitor.

O conteúdo atualizado é marcado como "Atualizado em [data]" no cabeçalho do artigo para transparência.`,
  },
  {
    icon: BarChart3,
    title: 'Como classificamos sentimento e impacto',
    content: `**Sentimento** é classificado como positivo, negativo, neutro ou misto com base na análise do conteúdo pela IA. O modelo considera o tom da notícia, dados citados e contexto de mercado.

**Nível de impacto** (baixo, médio, alto, crítico) é estimado com base em:
- Relevância dos ativos envolvidos
- Magnitude dos valores citados
- Alcance geográfico e setorial
- Urgência temporal do evento

Ambas as classificações são estimativas e podem não refletir o impacto real de mercado.`,
  },
  {
    icon: AlertTriangle,
    title: 'Limitações da IA',
    content: `O FinAI Pulse utiliza inteligência artificial com capacidades e limitações conhecidas:

- **Alucinação**: modelos de linguagem podem gerar informações incorretas ou inventadas. Todas as análises são baseadas em conteúdo coletado de fontes reais, mas erros podem ocorrer.
- **Desatualização**: há um intervalo entre a ocorrência de um evento e sua indexação na plataforma.
- **Viés de dados**: a qualidade e o equilíbrio das análises dependem da diversidade das fontes configuradas.
- **Sem contexto proprietário**: a IA não tem acesso a informações privilegiadas ou não públicas.
- **Confiança variável**: cada artigo exibe um score de confiança da IA (0-100%) que indica o nível de certeza estimado sobre o conteúdo.`,
  },
];

export default function Metodologia() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground mb-8 flex-wrap">
        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span>Metodologia</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Metodologia editorial</span>
        </div>
        <h1 className="font-mono text-3xl font-semibold mb-4 leading-tight">
          Como o FinAI Pulse<br />coleta, analisa e publica
        </h1>
        <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-2xl">
          O FinAI Pulse coleta informações de fontes públicas e/ou licenciadas, organiza eventos relevantes de mercado e utiliza inteligência artificial para gerar resumos e análises informativas. O sistema busca identificar ativos relacionados, sentimento de mercado e possíveis impactos, sempre com foco em transparência e rastreabilidade.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {SECTIONS.map((s, i) => (
          <section key={i} className="border-t border-ds-border pt-8">
            <div className="flex items-center gap-3 mb-4">
              <s.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <h2 className="font-mono text-sm font-semibold">{s.title}</h2>
            </div>
            <div className="font-sans text-sm text-muted-foreground leading-relaxed space-y-3 pl-7">
              {s.content.split('\n\n').map((para, j) => {
                if (para.match(/^\d+\./m)) {
                  return (
                    <div key={j} className="space-y-1">
                      {para.split('\n').map((line, k) => (
                        <p key={k} className={line.match(/^\d+\./) ? 'pl-4' : ''}>{line}</p>
                      ))}
                    </div>
                  );
                }
                if (para.includes('**')) {
                  return (
                    <div key={j} className="space-y-1.5">
                      {para.split('\n').map((line, k) => {
                        const parts = line.split(/\*\*(.+?)\*\*/g);
                        return (
                          <p key={k} className={line.startsWith('-') ? 'pl-4' : ''}>
                            {parts.map((part, pi) => pi % 2 === 1 ? <strong key={pi} className="text-foreground/70 font-semibold">{part}</strong> : part)}
                          </p>
                        );
                      })}
                    </div>
                  );
                }
                return <p key={j}>{para}</p>;
              })}
            </div>
          </section>
        ))}

        {/* Final disclaimer */}
        <section className="border-t border-ds-border pt-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-mono text-sm font-semibold mb-3">Aviso de não recomendação de investimento</h2>
              <div className="bg-ds-surface2 border border-ds-border rounded-lg p-4">
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  O conteúdo do FinAI Pulse é meramente informativo e educacional. <strong className="text-foreground/60">Não constitui recomendação de investimento, consultoria financeira, oferta de compra ou venda de ativos, nem garantia de resultados.</strong> Informações podem conter atrasos, erros ou imprecisões. Sempre consulte fontes oficiais e profissionais qualificados antes de tomar decisões financeiras.
                </p>
                <p className="font-sans text-xs text-muted-foreground/60 mt-3">
                  A utilização dos serviços do FinAI Pulse implica na aceitação desta condição. O FinAI Pulse não se responsabiliza por decisões tomadas com base no conteúdo da plataforma.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}