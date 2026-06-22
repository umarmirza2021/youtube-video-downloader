export const SITE_NAME = 'Media Downloader';

export function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL;
  if (configured) return String(configured).replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export function getGitHubUrl() {
  return import.meta.env.VITE_GITHUB_URL || 'https://github.com/umarmirza2021/youtube-video-downloader';
}