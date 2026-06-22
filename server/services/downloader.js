import * as ytdlp from './ytdlp.js';
import * as rapidapi from './rapidapi.js';
import * as cache from './cache.js';
import * as quickMeta from './quick-meta.js';
import * as r2 from './r2.js';
import * as tempDownload from './temp-download.js';
import { PRESET_FORMATS } from './preset-formats.js';
import { QUALITY_FORMATS } from './format-map.js';
import { streamProcessToResponse } from './stream-response.js';

export function isR2Skipped() {
  const v = process.env.SKIP_R2 || process.env.R2_DISABLED || '';
  return v === '1' || v === 'true' || v === 'yes';
}

export function useR2Storage() {
  if (isR2Skipped()) return false;
  return r2.isConfigured();
}

export function getStorageMode() {
  if (isR2Skipped()) return 'direct';
  if (r2.isConfigured()) return 'r2';
  return 'direct';
}

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
  info.formats = PRESET_FORMATS;

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
    let formats = quickMeta.mergeEnrichedFormats(PRESET_FORMATS, full.formats);

    const missing = formats.filter((f) => !f.filesizeFormatted && QUALITY_FORMATS[f.quality]);
    if (missing.length) {
      const sizeMap = {};
      await Promise.all(missing.map(async (f) => {
        const bytes = await ytdlp.getFormatFilesize(url, QUALITY_FORMATS[f.quality].id);
        if (bytes) sizeMap[f.quality] = bytes;
      }));
      formats = quickMeta.applyExactSizes(formats, sizeMap);
    }

    const key = cacheKey(url);
    const existing = cache.get(key) || {};
    const merged = {
      ...existing,
      ...full,
      formats,
      instant: false,
    };
    cache.set(key, merged);
    return {
      title: full.title,
      channel: full.channel,
      duration: full.duration,
      thumbnail: full.thumbnail,
      formats,
      engine: full.engine,
    };
  } catch {
    const sizeMap = await ytdlp.getPresetFormatSizes(url, QUALITY_FORMATS).catch(() => ({}));
    return { formats: quickMeta.applyExactSizes(PRESET_FORMATS, sizeMap) };
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

export async function downloadVideoToR2(url, format) {
  const ytdlpOk = await ytdlp.checkYtdlp();
  if (!ytdlpOk) throw new Error('yt-dlp is not installed');

  const ext = format.ext || 'mp4';
  const safeTitle = (format.title || 'video').replace(/[^\w\s.-]/g, '').slice(0, 80);
  const filename = `${safeTitle}.${ext}`;

  const { filePath, ext: outExt, cleanup } = await tempDownload.downloadToTempFile(url, format);

  try {
    const key = r2.buildObjectKey(filename);
    await r2.uploadFile(filePath, key, { ext: outExt || ext });
    const downloadUrl = await r2.getDownloadUrl(key, filename);
    const expiry = parseInt(process.env.R2_PRESIGN_EXPIRY || '3600', 10);

    return {
      downloadUrl,
      filename,
      storage: 'r2',
      expiresIn: expiry,
    };
  } finally {
    await cleanup();
  }
}

export async function downloadVideo(url, format, res) {
  if (useR2Storage()) {
    try {
      const result = await downloadVideoToR2(url, format);
      return res.json(result);
    } catch (err) {
      console.error('R2 upload failed, serving directly from server:', err.message);
      if (res.headersSent) throw err;
    }
  }

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
  const safeTitle = (format.title || 'video').replace(/[^\w\s.-]/g, '').slice(0, 80);
  const filename = `${safeTitle}.${ext}`;

  const proc = ytdlp.streamDownload(url, { ...format, title: format.title || safeTitle }, {
    onError: (msg) => console.error('yt-dlp stream error:', msg),
  });

  streamProcessToResponse(proc, res, {
    contentType: ext === 'mp3' ? 'audio/mpeg' : 'video/mp4',
    filename,
    classifyError: (msg) => classifyError(new Error(msg)),
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