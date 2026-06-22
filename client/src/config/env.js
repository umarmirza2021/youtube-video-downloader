/**
 * API URL resolution — same origin in production (Render full-stack).
 * Override with VITE_API_URL for split deploys (Netlify + Render).
 */
export function getApiUrl() {
  const configured = import.meta.env.VITE_API_URL;

  if (configured) {
    return String(configured).replace(/\/$/, '');
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api';
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }

  return '';
}

export function isApiConfigured() {
  return Boolean(getApiUrl());
}

export function getApiUrlOrThrow() {
  const url = getApiUrl();
  if (!url) {
    throw new Error('API URL is not configured.');
  }
  return url;
}