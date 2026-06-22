import { PRESET_FORMATS } from './preset-formats.js';

export function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function isPlaylistUrl(url) {
  return /[?&]list=/.test(url) || /\/playlist/.test(url);
}

function parseDuration(seconds) {
  if (!seconds) return null;
  const n = parseInt(seconds, 10);
  if (Number.isNaN(n)) return null;
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = Math.floor(n % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function buildInstantInfo(url) {
  const videoId = extractVideoId(url);
  if (!videoId) return null;

  return {
    id: videoId,
    title: 'Loading title…',
    channel: '',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: null,
    formats: PRESET_FORMATS,
    isPlaylist: false,
    engine: 'instant',
    instant: true,
  };
}

export async function getQuickVideoInfo(url) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  let title = 'Unknown video';
  let channel = 'Unknown';

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      title = data.title || title;
      channel = data.author_name || channel;
    }
  } catch {
    // oEmbed failed — keep thumbnail-based fallback
  }

  return {
    id: videoId,
    title,
    channel,
    thumbnail,
    duration: null,
    formats: PRESET_FORMATS,
    isPlaylist: false,
    engine: 'oembed',
    instant: true,
  };
}

function formatFileSize(bytes) {
  if (!bytes) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Apply exact byte sizes from yt-dlp --print filesize lookups */
export function applyExactSizes(formats, sizeMap) {
  if (!sizeMap || !Object.keys(sizeMap).length) return formats;

  return formats.map((fmt) => {
    const bytes = sizeMap[fmt.quality];
    if (!bytes) return fmt;
    return {
      ...fmt,
      filesize: bytes,
      filesizeFormatted: formatFileSize(bytes),
      estimated: false,
    };
  });
}

export function mergeEnrichedFormats(presets, enriched) {
  if (!enriched?.length) return presets;

  return presets.map((preset) => {
    const match = enriched.find((f) => f.quality === preset.quality);
    if (!match) return preset;
    return {
      ...preset,
      id: match.id || preset.id,
      filesize: match.filesize ?? preset.filesize,
      filesizeFormatted: match.filesizeFormatted || preset.filesizeFormatted,
      needsMerge: match.needsMerge ?? preset.needsMerge,
      estimated: match.filesizeFormatted ? false : preset.estimated,
    };
  });
}

export { parseDuration };