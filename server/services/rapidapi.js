const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'yt-api.p.rapidapi.com';

function isConfigured() {
  return Boolean(RAPIDAPI_KEY);
}

function parseDuration(isoOrSeconds) {
  if (typeof isoOrSeconds === 'number') {
    const h = Math.floor(isoOrSeconds / 3600);
    const m = Math.floor((isoOrSeconds % 3600) / 60);
    const s = Math.floor(isoOrSeconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  if (typeof isoOrSeconds === 'string' && isoOrSeconds.startsWith('PT')) {
    const match = isoOrSeconds.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const h = parseInt(match[1] || '0', 10);
      const m = parseInt(match[2] || '0', 10);
      const s = parseInt(match[3] || '0', 10);
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      return `${m}:${String(s).padStart(2, '0')}`;
    }
  }
  return isoOrSeconds || '0:00';
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

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function rapidFetch(path, params = {}) {
  const url = new URL(`https://${RAPIDAPI_HOST}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`RapidAPI error (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

function buildFormatsFromRapid(data) {
  const options = [];
  const formats = data.formats || data.adaptiveFormats || data.streamingData?.formats || [];

  const heights = [1080, 720, 480, 360];
  for (const height of heights) {
    const fmt = formats.find(
      (f) => (f.height === height || f.qualityLabel === `${height}p`) && f.mimeType?.includes('video')
    ) || formats.find((f) => f.height === height);

    if (fmt) {
      const size = fmt.contentLength || fmt.filesize;
      options.push({
        id: fmt.itag?.toString() || fmt.format_id || `${height}p`,
        label: `${height}p MP4`,
        quality: `${height}p`,
        ext: 'mp4',
        type: 'video',
        filesize: size ? parseInt(size, 10) : null,
        filesizeFormatted: formatFileSize(size ? parseInt(size, 10) : null),
        downloadUrl: fmt.url || fmt.downloadUrl,
        needsMerge: false,
      });
    }
  }

  const audioFmt = formats.find((f) => f.mimeType?.includes('audio') || f.quality === 'AUDIO_QUALITY_MEDIUM');
  if (audioFmt) {
    const size = audioFmt.contentLength || audioFmt.filesize;
    options.push({
      id: audioFmt.itag?.toString() || 'audio',
      label: 'MP3 Audio',
      quality: 'audio',
      ext: 'mp3',
      type: 'audio',
      filesize: size ? parseInt(size, 10) : null,
      filesizeFormatted: formatFileSize(size ? parseInt(size, 10) : null),
      downloadUrl: audioFmt.url || audioFmt.downloadUrl,
      needsMerge: false,
    });
  }

  if (options.length === 0) {
    const qualities = [
      { label: '1080p MP4', quality: '1080p', ext: 'mp4', type: 'video' },
      { label: '720p MP4', quality: '720p', ext: 'mp4', type: 'video' },
      { label: '480p MP4', quality: '480p', ext: 'mp4', type: 'video' },
      { label: '360p MP4', quality: '360p', ext: 'mp4', type: 'video' },
      { label: 'MP3 Audio', quality: 'audio', ext: 'mp3', type: 'audio' },
    ];
    qualities.forEach((q) => {
      options.push({ ...q, id: q.quality, filesize: null, filesizeFormatted: null, needsMerge: false });
    });
  }

  return options;
}

export async function getVideoInfo(url) {
  if (!isConfigured()) throw new Error('RapidAPI is not configured');

  const videoId = extractVideoId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  const data = await rapidFetch('/dl', { id: videoId }).catch(async () => {
    return rapidFetch('/video/info', { id: videoId });
  });

  const title = data.title || data.videoDetails?.title || 'Unknown';
  const channel = data.channel || data.author || data.videoDetails?.author || 'Unknown';
  const thumbnail = data.thumbnail || data.thumbnails?.[data.thumbnails.length - 1]?.url
    || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const duration = parseDuration(data.lengthSeconds || data.duration || data.videoDetails?.lengthSeconds);

  return {
    id: videoId,
    title,
    channel,
    thumbnail,
    duration,
    isPlaylist: false,
    formats: buildFormatsFromRapid(data),
    engine: 'rapidapi',
  };
}

export async function getFormats(url) {
  const info = await getVideoInfo(url);
  return { formats: info.formats, title: info.title, engine: 'rapidapi' };
}

export async function getDownloadUrl(url, format) {
  if (!isConfigured()) throw new Error('RapidAPI is not configured');

  const videoId = extractVideoId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  if (format.downloadUrl) return format.downloadUrl;

  const data = await rapidFetch('/dl', { id: videoId, format: format.quality || format.id });
  const downloadUrl = data.url || data.link || data.downloadUrl;

  if (!downloadUrl) {
    const formats = buildFormatsFromRapid(data);
    const match = formats.find((f) => f.quality === format.quality || f.id === format.id);
    if (match?.downloadUrl) return match.downloadUrl;
    throw new Error('Download URL not available from RapidAPI');
  }

  return downloadUrl;
}

export function isAvailable() {
  return isConfigured();
}