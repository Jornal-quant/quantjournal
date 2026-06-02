# Correção de vulnerabilidades de segurança — quantjournal

**Data:** 02/06/2026
**Responsável:** time de desenvolvimento

---

## Resumo executivo

Ao instalar as dependências do projeto, o gerenciador de pacotes (`npm`)
identificou **18 vulnerabilidades de segurança** nas bibliotecas de terceiros
usadas pela aplicação (10 de severidade moderada e 8 de severidade alta).

Aplicamos a correção automática **segura** (`npm audit fix`), que atualizou as
bibliotecas para versões corrigidas **sem alterar o comportamento do sistema**.

**Resultado:** passamos de **18 → 2 vulnerabilidades**, uma redução de ~89%.
O projeto foi testado depois da correção e **continua funcionando normalmente**
(build de produção e servidor de desenvolvimento validados).

---

## O que era o problema?

Todo projeto moderno depende de centenas de bibliotecas externas. Com o tempo,
pesquisadores descobrem falhas de segurança nessas bibliotecas e publicam
correções. Quando rodamos o projeto, o `npm` nos avisou que algumas das
bibliotecas que estávamos usando tinham versões com falhas conhecidas.

As falhas mais relevantes envolviam bibliotecas muito usadas, como:

| Biblioteca | Para que serve | Tipo de falha |
|---|---|---|
| **axios** | Fazer requisições à internet/API | SSRF e contaminação de dados (alta) |
| **vite** | Ferramenta de build e dev server | Leitura indevida de arquivos (alta) |
| **lodash** | Utilitários de programação | Injeção de código (alta) |
| **dompurify** | Limpeza de HTML (anti-XSS) | Cross-site scripting (moderada) |
| **postcss / rollup / ws** | Build e comunicação | DoS e vazamento (alta/moderada) |

> Importante: **não houve invasão nem incidente**. São falhas *potenciais* nas
> ferramentas, corrigidas de forma preventiva — boa prática de manutenção.

---

## O que foi feito

1. Instalação das dependências (`npm install`).
2. Auditoria de segurança (`npm audit`) → identificadas 18 vulnerabilidades.
3. Correção automática segura (`npm audit fix`) → atualizou as bibliotecas para
   versões já corrigidas, **sem mudanças que quebram o sistema**.
4. **Verificação pós-correção:**
   - ✅ Build de produção (`npm run build`) concluído com sucesso.
   - ✅ Servidor de desenvolvimento (`npm run dev`) iniciou normalmente.

---

## Situação atual

| Métrica | Antes | Depois |
|---|---|---|
| Total de vulnerabilidades | 18 | **2** |
| Alta severidade | 8 | **0** |
| Moderada severidade | 10 | **2** |

**Todas as falhas de alta severidade foram eliminadas.**

---

## O que ainda falta (2 pendências)

Restaram **2 vulnerabilidades moderadas**, ambas na mesma biblioteca:

- **`quill` / `react-quill`** — é o componente de **editor de texto rico**
  (onde se escreve/formata conteúdo). A versão corrigida exige uma atualização
  "que quebra compatibilidade" (`npm audit fix --force`), o que poderia
  **alterar ou quebrar o editor de texto** do sistema.

**Recomendação:** não aplicar a correção forçada automaticamente. Em vez disso,
avaliar e testar com calma a migração do editor para uma versão mais nova
(ou trocar por uma alternativa moderna), garantindo que a edição de conteúdo
continue funcionando antes de publicar a mudança.

Risco de manter por enquanto: **baixo** — a falha é de severidade moderada
(XSS no editor) e só é explorável em cenários específicos de conteúdo malicioso
colado no editor.

---

## Próximos passos sugeridos

1. **Agora:** seguir com o desenvolvimento — a base está saudável e sem falhas
   de alta severidade.
2. **Curto prazo:** planejar a atualização do editor de texto (`react-quill`)
   em uma tarefa dedicada, com testes.
3. **Rotina:** rodar `npm audit` periodicamente (ex.: a cada nova feature ou
   mensalmente) para manter as dependências em dia.

---

*Documento gerado para fins de comunicação executiva. Detalhes técnicos
completos das falhas estão disponíveis no relatório do `npm audit`.*
