export const PRESET_FORMATS = [
  { label: '1080p MP4', quality: '1080p', ext: 'mp4', type: 'video' },
  { label: '720p MP4', quality: '720p', ext: 'mp4', type: 'video' },
  { label: '480p MP4', quality: '480p', ext: 'mp4', type: 'video' },
  { label: '360p MP4', quality: '360p', ext: 'mp4', type: 'video' },
  { label: 'MP3 Audio', quality: 'audio', ext: 'mp3', type: 'audio' },
];

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
    title: 'Loading…',
    channel: '',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: null,
    formats: PRESET_FORMATS,
    isPlaylist: false,
    instant: true,
  };
}