/** Map UI quality keys to yt-dlp format selectors (server-side only — avoids URL encoding bugs) */
export const QUALITY_FORMATS = {
  '1080p': {
    id: 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best[height<=1080]',
    needsMerge: true,
    ext: 'mp4',
    type: 'video',
    label: '1080p MP4',
  },
  '720p': {
    id: 'best[height<=720][ext=mp4]/bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]',
    needsMerge: true,
    ext: 'mp4',
    type: 'video',
    label: '720p MP4',
  },
  '480p': {
    id: 'best[height<=480][ext=mp4]/bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]',
    needsMerge: true,
    ext: 'mp4',
    type: 'video',
    label: '480p MP4',
  },
  '360p': {
    id: 'best[height<=360][ext=mp4]/18/best[height<=360]',
    needsMerge: false,
    ext: 'mp4',
    type: 'video',
    label: '360p MP4',
  },
  audio: {
    id: 'bestaudio/best[acodec!=none]',
    needsMerge: false,
    ext: 'mp3',
    type: 'audio',
    label: 'MP3 Audio',
  },
};

export function resolveFormat(input) {
  if (!input) return null;

  const quality = input.quality || input.formatId;
  if (quality && QUALITY_FORMATS[quality]) {
    const preset = QUALITY_FORMATS[quality];
    return {
      ...preset,
      quality,
      title: input.title || 'video',
    };
  }

  if (input.formatId) {
    return {
      id: input.formatId,
      ext: input.ext || 'mp4',
      type: input.type || 'video',
      quality: input.quality || '',
      needsMerge: input.needsMerge === true || input.needsMerge === '1' || input.needsMerge === 'true',
      title: input.title || 'video',
    };
  }

  return null;
}