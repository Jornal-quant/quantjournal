# SEO & Google News — Capital Times

O que já está no código (deploy automático) e o que você precisa fazer manualmente
nos painéis do Google. Objetivo: tráfego orgânico do Google — o maior multiplicador
de longo prazo para um portal de notícias.

## ✅ Já implementado no site

- **Sitemap geral:** `https://<seu-dominio>/sitemap.xml` (páginas, categorias e até
  1000 artigos publicados).
- **Sitemap do Google News:** `https://<seu-dominio>/news-sitemap.xml` — só matérias
  das **últimas 48h**, com as tags `<news:news>` (nome da publicação, idioma, data,
  título) que o Google News exige.
- **robots.txt** aponta para os dois sitemaps.
- **Dados estruturados** (JSON-LD `NewsArticle`) em cada matéria: headline (≤110
  chars), data de publicação/modificação, autor, publisher + logo, imagem,
  `inLanguage: pt-BR`, `isAccessibleForFree`. Também Open Graph e Twitter Card.

> Troque `<seu-dominio>` por `capitaltimes.com.br` (ou o domínio oficial
> quando existir). Os sitemaps usam o host da requisição, então funcionam em
> qualquer domínio sem mudar código.

## 🔧 O que VOCÊ precisa fazer (uma vez)

### 1. Google Search Console (indexação no Google "normal")
1. Acesse https://search.google.com/search-console e adicione a propriedade
   (use "Prefixo do URL" com a URL completa do site).
2. Verifique a posse (método mais fácil: meta tag no `<head>` ou registro DNS).
   - Se for por meta tag, me mande a tag que eu coloco no `index.html`.
3. Em **Sitemaps**, envie:
   - `sitemap.xml`
   - `news-sitemap.xml`
4. Use **Inspeção de URL** → "Solicitar indexação" para a home e algumas matérias,
   pra acelerar o primeiro rastreamento.

### 2. Google News / Publisher Center (aparecer na aba Notícias e no Google News)
1. Acesse https://publishercenter.google.com e crie uma **publicação** "Capital Times".
2. Informe a URL do site, logo (quadrado e retangular), idioma **Português (Brasil)**
   e país **Brasil**.
3. Configure as seções puxando das URLs de categoria
   (`/categoria/bolsa`, `/categoria/economia`, etc.) ou da home.
4. Envie para revisão. Requisitos que já atendemos: datas claras, autoria, URLs
   estáveis, conteúdo original, dados estruturados `NewsArticle`.

### 3. Bing Webmaster Tools (bônus, leva 2 min)
- https://www.bing.com/webmasters — adicione o site e envie os mesmos sitemaps.
  (Bing alimenta também o ChatGPT Search/Copilot.)

## ⚠️ Limitação conhecida (melhoria futura)

O site é uma SPA (Vite/React) — os meta tags e o JSON-LD são injetados via
JavaScript. O Google renderiza JS e indexa, mas é mais lento e menos robusto que
HTML pré-renderizado. Para SEO de notícias no nível máximo, o ideal futuro é
**SSR/prerender** das páginas de artigo (ex.: migrar a rota `/artigo/:id` para ser
renderizada no servidor, ou usar prerender). É uma mudança maior — vale quando o
volume justificar.

## 📈 Dicas de conteúdo que ajudam o ranqueamento

- **Títulos claros** com a palavra-chave principal (o que/quem/quando).
- **Frescor + constância:** publicar com regularidade sinaliza um site de notícias ativo.
- **Atualizar matérias** em desenvolvimento (o `dateModified` já é enviado).
- **Imagens** com a `image_url` preenchida (melhora CTR e elegibilidade no Google News/Discover).
