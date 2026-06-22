import * as ytdlp from './ytdlp.js';
import * as rapidapi from './rapidapi.js';
import * as cache from './cache.js';
import * as quickMeta from './quick-meta.js';
import { PRESET_FORMATS } from './preset-formats.js';

function cacheKey(url) {
  return url.trim().toLowerCase();
}

export async function getQuickVideoInfo(url) {
  if (quickMeta.isPlaylistUrl(url)) {
    return getVideoInfo(url);
  }

  const key = cacheKey(url);
  const cached = cache.get(key);
  if (cached && !cached.isPlaylist) {
    return { ...cached, formats: cached.formats || PRESET_FORMATS, cached: true };
  }

  const info = await quickMeta.getQuickVideoInfo(url);
  cache.set(key, info);
  return info;
}

export async function enrichVideoInfo(url) {
  const ytdlpOk = await ytdlp.checkYtdlp();
  if (!ytdlpOk) {
    return { formats: PRESET_FORMATS, duration: null };
  }

  try {
    const full = await ytdlp.getVideoInfo(url);
    const key = cacheKey(url);
    const existing = cache.get(key) || {};
    const merged = {
      ...existing,
      ...full,
      formats: quickMeta.mergeEnrichedFormats(PRESET_FORMATS, full.formats),
      instant: false,
    };
    cache.set(key, merged);
    return {
      title: full.title,
      channel: full.channel,
      duration: full.duration,
      thumbnail: full.thumbnail,
      formats: merged.formats,
      engine: full.engine,
    };
  } catch {
    return { formats: PRESET_FORMATS, duration: null };
  }
}

export async function getVideoInfo(url) {
  if (!quickMeta.isPlaylistUrl(url)) {
    return getQuickVideoInfo(url);
  }

  const key = cacheKey(url);
  const cached = cache.get(key);
  if (cached) return { ...cached, cached: true };

  const ytdlpOk = await ytdlp.checkYtdlp();

  if (ytdlpOk) {
    try {
      const info = await ytdlp.getVideoInfo(url);
      cache.set(key, info);
      return info;
    } catch (err) {
      if (rapidapi.isAvailable()) {
        const info = await rapidapi.getVideoInfo(url);
        cache.set(key, info);
        return info;
      }
      throw err;
    }
  }

  if (rapidapi.isAvailable()) {
    const info = await rapidapi.getVideoInfo(url);
    cache.set(key, info);
    return info;
  }

  throw new Error('No download engine available. Install yt-dlp or configure RapidAPI.');
}

export async function getFormats(url) {
  const enriched = await enrichVideoInfo(url);
  return {
    formats: enriched.formats,
    title: enriched.title,
    duration: enriched.duration,
    engine: enriched.engine || 'ytdlp',
  };
}

export async function downloadVideo(url, format, res) {
  const ytdlpOk = await ytdlp.checkYtdlp();

  if (ytdlpOk) {
    try {
      return streamYtdlp(url, format, res);
    } catch (err) {
      if (rapidapi.isAvailable()) {
        return streamRapidapi(url, format, res);
      }
      throw err;
    }
  }

  if (rapidapi.isAvailable()) {
    return streamRapidapi(url, format, res);
  }

  throw new Error('No download engine available.');
}

function streamYtdlp(url, format, res) {
  const ext = format.ext || 'mp4';
  const safeTitle = (format.title || 'video').replace(/[^\w\s-]/g, '').slice(0, 80);
  const filename = `${safeTitle}.${ext}`;

  res.setHeader('Content-Type', ext === 'mp3' ? 'audio/mpeg' : 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Transfer-Encoding', 'chunked');

  const proc = ytdlp.streamDownload(url, format, {
    onError: (msg) => {
      console.error('yt-dlp stream error:', msg);
    },
  });

  proc.stdout.pipe(res, { highWaterMark: 1024 * 1024 });

  proc.on('close', (code) => {
    if (code !== 0 && !res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  });

  res.on('close', () => {
    proc.kill();
  });

  return proc;
}

async function streamRapidapi(url, format, res) {
  const downloadUrl = await rapidapi.getDownloadUrl(url, format);
  const ext = format.ext || 'mp4';
  const safeTitle = (format.title || 'video').replace(/[^\w\s-]/g, '').slice(0, 80);
  const filename = `${safeTitle}.${ext}`;

  const upstream = await fetch(downloadUrl);
  if (!upstream.ok) throw new Error(`Failed to fetch video: ${upstream.statusText}`);

  res.setHeader('Content-Type', ext === 'mp3' ? 'audio/mpeg' : 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const contentLength = upstream.headers.get('content-length');
  if (contentLength) res.setHeader('Content-Length', contentLength);

  const reader = upstream.body.getReader();

  const pump = async () => {
    const { done, value } = await reader.read();
    if (done) {
      res.end();
      return;
    }
    res.write(Buffer.from(value));
    return pump();
  };

  await pump();
}

export function classifyError(err) {
  const msg = err.message || '';
  if (ytdlp.classifyError) {
    const classified = ytdlp.classifyError(msg);
    if (classified.code !== 'UNKNOWN') return classified;
  }
  if (/rapidapi/i.test(msg)) return { code: 'API_ERROR', message: msg };
  if (/invalid/i.test(msg)) return { code: 'INVALID_URL', message: 'Invalid YouTube URL.' };
  return { code: 'UNKNOWN', message: msg || 'An error occurred.' };
}