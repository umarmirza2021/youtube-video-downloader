import { useEffect } from 'react';
import { getSiteUrl } from '../config/site.js';

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  if (!href) return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSeoMeta(page) {
  useEffect(() => {
    if (!page) return;

    const siteUrl = getSiteUrl();
    const canonical = siteUrl ? `${siteUrl}${page.path === '/' ? '/' : page.path}` : '';

    document.title = page.title;
    setMeta('description', page.description);
    setMeta('keywords', page.keywords);
    setMeta('og:title', page.title, 'property');
    setMeta('og:description', page.description, 'property');
    setMeta('og:url', canonical, 'property');
    setMeta('twitter:title', page.title);
    setMeta('twitter:description', page.description);
    setCanonical(canonical);
  }, [page]);
}