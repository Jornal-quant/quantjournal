import { useEffect } from 'react';

export default function ArticleSEO({ article }) {
  useEffect(() => {
    if (!article) return;

    const canonicalUrl = window.location.href;
    const logoUrl = 'https://finainews.com/logo.png';

    // Schema.org
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.meta_description || article.summary || '',
      datePublished: article.created_date,
      dateModified: article.updated_date || article.created_date,
      author: { '@type': 'Organization', name: 'FinAI Pulse' },
      publisher: {
        '@type': 'Organization',
        name: 'FinAI Pulse',
        logo: { '@type': 'ImageObject', url: logoUrl },
      },
      image: article.image_url || '',
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

    // Title
    document.title = `${article.meta_title || article.title} | FinAI Pulse`;

    // Basic meta
    setMeta('description', article.meta_description || article.summary || '');

    // Open Graph
    setMeta('og:type', 'article', true);
    setMeta('og:title', article.meta_title || article.title, true);
    setMeta('og:description', article.meta_description || article.summary || '', true);
    setMeta('og:image', article.image_url || '', true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:site_name', 'FinAI Pulse', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', article.meta_title || article.title);
    setMeta('twitter:description', article.meta_description || article.summary || '');
    setMeta('twitter:image', article.image_url || '');

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