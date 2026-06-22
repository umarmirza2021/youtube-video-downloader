import { getApiUrl, getApiUrlOrThrow } from './config/env.js';

export function getApiBase() {
  return getApiUrl();
}

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (text.includes('Not Found') || res.status === 404) {
      throw new Error(
        'API server not reachable. Set VITE_API_URL in Netlify to your Render backend URL ' +
        '(e.g. https://your-app.onrender.com/api) and redeploy.'
      );
    }
    throw new Error(text.slice(0, 120) || `Server error (${res.status})`);
  }
}

async function parseError(res, fallback) {
  const data = await safeJson(res).catch(() => ({}));
  const err = new Error(data.error || fallback);
  err.code = data.code;
  err.retryAfter = data.retryAfter;
  throw err;
}

function apiUrl(path) {
  const base = getApiUrlOrThrow();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export async function fetchVideoInfo(url) {
  const res = await fetch(apiUrl('/info'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Failed to fetch video info');
  return data;
}

export async function enrichVideoInfo(url) {
  const res = await fetch(apiUrl(`/enrich?url=${encodeURIComponent(url)}`));
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Failed to enrich video info');
  return data;
}

export async function detectPlatform(url) {
  const res = await fetch(apiUrl('/detect'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || 'Unsupported URL');
  return data;
}

export async function fetchUniversalInfo({ url, username, platform }) {
  const res = await fetch(apiUrl('/universal/info'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, username, platform }),
  });
  if (!res.ok) await parseError(res, 'Failed to fetch media info');
  return safeJson(res);
}

export function triggerDownload(url, format, videoTitle) {
  const params = new URLSearchParams({
    url,
    formatId: format.id,
    ext: format.ext || 'mp4',
    type: format.type || 'video',
    quality: format.quality || '',
    needsMerge: format.needsMerge ? '1' : '0',
    convertHorizontal: format.convertHorizontal ? '1' : '0',
    title: videoTitle || 'video',
  });

  const link = document.createElement('a');
  link.href = `${apiUrl('/download')}?${params}`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function triggerUniversalDownload({ url, platform, format, title, username, storyId }) {
  const params = new URLSearchParams({
    url: url || '',
    platform,
    formatId: format.id,
    ext: format.ext || 'mp4',
    type: format.type || 'video',
    quality: format.quality || '',
    needsMerge: format.needsMerge ? '1' : '0',
    convertHorizontal: format.convertHorizontal ? '1' : '0',
    watermark: format.watermark ? '1' : '0',
    title: title || 'download',
    username: username || '',
    storyId: storyId || '',
  });

  const link = document.createElement('a');
  link.href = `${apiUrl('/universal/download')}?${params}`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function checkHealth() {
  const base = getApiUrl();
  if (!base) throw new Error('VITE_API_URL not configured');
  const res = await fetch(`${base}/health`);
  return safeJson(res);
}