import { useEffect } from 'react';

export default function ArticleSEO({ article }) {
  useEffect(() => {
    if (!article) return;

    const origin = window.location.origin;
    // Canonical sem query/hash para evitar URLs duplicadas no índice.
    const canonicalUrl = `${origin}${window.location.pathname}`;
    const logoUrl = `${origin}/icon.svg`;
    const ogImage = article.image_url || `${origin}/og-cover.png`;

    // Schema.org
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      headline: String(article.title || '').slice(0, 110), // Google News: ≤110 chars
      description: article.meta_description || article.summary || '',
      datePublished: article.created_date,
      dateModified: article.updated_date || article.created_date,
      inLanguage: 'pt-BR',
      isAccessibleForFree: true,
      author: { '@type': 'Organization', name: 'Capital Times', url: origin },
      publisher: {
        '@type': 'Organization',
        name: 'Capital Times',
        logo: { '@type': 'ImageObject', url: logoUrl },
      },
      image: ogImage,
      url: canonicalUrl,
      keywords: article.tags || '',
      articleSection: article.category || '',
    };

    const setMeta = (name, content, isOg = false) => {
      const attr = isOg ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content || '');
    };

    // Canonical
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalUrl);

    // Title
    document.title = `${article.meta_title || article.title} | Capital Times`;

    // Basic meta
    setMeta('description', article.meta_description || article.summary || '');

    // Open Graph
    setMeta('og:type', 'article', true);
    setMeta('og:title', article.meta_title || article.title, true);
    setMeta('og:description', article.meta_description || article.summary || '', true);
    setMeta('og:image', ogImage, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:site_name', 'Capital Times', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', article.meta_title || article.title);
    setMeta('twitter:description', article.meta_description || article.summary || '');
    setMeta('twitter:image', ogImage);

    // Schema JSON-LD
    let schemaEl = document.getElementById('article-schema');
    if (!schemaEl) {
      schemaEl = document.createElement('script');
      schemaEl.id = 'article-schema';
      schemaEl.type = 'application/ld+json';
      document.head.appendChild(schemaEl);
    }
    schemaEl.textContent = JSON.stringify(schema);

    return () => {
      // cleanup schema on unmount
      const el = document.getElementById('article-schema');
      if (el) el.remove();
    };
  }, [article?.id]);

  return null;
}