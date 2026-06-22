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
        'API server not reachable. Check that the backend is running and redeploy if needed.'
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

/** Hidden iframe keeps the download connection alive while yt-dlp starts on the server */
function startNativeDownload(downloadUrl) {
  let frame = document.getElementById('yt-download-frame');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'yt-download-frame';
    frame.name = 'yt-download-frame';
    frame.style.display = 'none';
    document.body.appendChild(frame);
  }
  frame.src = downloadUrl;
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
  const res = await fetch(apiUrl('/enrich'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
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

export async function triggerDownload(url, format, videoTitle) {
  if (!format?.quality) {
    throw new Error('Select a quality first');
  }

  const res = await fetch(apiUrl('/download'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      quality: format.quality,
      title: videoTitle || 'video',
    }),
  });

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || 'Download failed');
    if (data.downloadUrl) {
      window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
      return data;
    }
  }

  if (!res.ok) {
    const data = await safeJson(res).catch(() => ({}));
    throw new Error(data.error || `Download failed (${res.status})`);
  }

  // Direct VPS stream (SKIP_R2=1 or R2 not configured)
  if (contentType.includes('video/') || contentType.includes('audio/')) {
    const blob = await res.blob();
    if (blob.size < 1000) throw new Error('Download failed — empty file. Try 360p.');
    const ext = format.ext || 'mp4';
    const safeName = (videoTitle || 'video').replace(/[^\w\s.-]/g, '').slice(0, 80);
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${safeName}.${ext}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 15000);
    return { storage: 'direct' };
  }

  const params = new URLSearchParams({
    url,
    quality: format.quality,
    title: videoTitle || 'video',
  });
  startNativeDownload(`${apiUrl('/download')}?${params}`);
}

export async function triggerUniversalDownload({ url, platform, format, title, username, storyId }) {
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

  startNativeDownload(`${apiUrl('/universal/download')}?${params}`);
}

export async function checkHealth() {
  const base = getApiUrl();
  if (!base) throw new Error('VITE_API_URL not configured');
  const res = await fetch(`${base}/health`);
  return safeJson(res);
}