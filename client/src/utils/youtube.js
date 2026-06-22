const MB_PER_MINUTE = {
  '1080p': 12,
  '720p': 7,
  '480p': 4,
  '360p': 2.5,
  audio: 1,
};

function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function withEstimatedSizes(formats, durationSeconds = 180) {
  const minutes = durationSeconds / 60;
  return formats.map((fmt) => {
    const mb = (MB_PER_MINUTE[fmt.quality] || 5) * minutes;
    const bytes = mb * 1024 * 1024;
    return {
      ...fmt,
      filesize: bytes,
      filesizeFormatted: `~${formatFileSize(bytes)}`,
      estimated: true,
    };
  });
}

export const PRESET_FORMATS = withEstimatedSizes([
  { label: '1080p MP4', quality: '1080p', ext: 'mp4', type: 'video' },
  { label: '720p MP4', quality: '720p', ext: 'mp4', type: 'video' },
  { label: '480p MP4', quality: '480p', ext: 'mp4', type: 'video' },
  { label: '360p MP4', quality: '360p', ext: 'mp4', type: 'video' },
  { label: 'MP3 Audio', quality: 'audio', ext: 'mp3', type: 'audio' },
]);

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

export function buildInstantVideo(url) {
  const videoId = extractVideoId(url);
  if (!videoId || isPlaylistUrl(url)) return null;

  return {
    id: videoId,
    title: 'Loading title…',
    channel: '',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: null,
    formats: PRESET_FORMATS,
    isPlaylist: false,
    instant: true,
  };
}