export const PRESET_FORMATS = [
  {
    id: 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
    label: '1080p MP4',
    quality: '1080p',
    ext: 'mp4',
    type: 'video',
    needsMerge: true,
  },
  {
    id: 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best',
    label: '720p MP4',
    quality: '720p',
    ext: 'mp4',
    type: 'video',
    needsMerge: true,
  },
  {
    id: 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best[height<=480]/best',
    label: '480p MP4',
    quality: '480p',
    ext: 'mp4',
    type: 'video',
    needsMerge: true,
  },
  {
    id: 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=360]+bestaudio/best[height<=360]/best',
    label: '360p MP4',
    quality: '360p',
    ext: 'mp4',
    type: 'video',
    needsMerge: true,
  },
  {
    id: 'bestaudio',
    label: 'MP3 Audio',
    quality: 'audio',
    ext: 'mp3',
    type: 'audio',
    needsMerge: false,
  },
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
    title: 'Loading title…',
    channel: '',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: null,
    formats: PRESET_FORMATS,
    isPlaylist: false,
    instant: true,
  };
}