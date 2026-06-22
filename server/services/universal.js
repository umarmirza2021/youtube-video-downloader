import { detectPlatform } from './platform-detect.js';
import * as instagram from './instagram.js';
import * as ytdlpUniversal from './ytdlp-universal.js';
import * as rapidapiPlatforms from './rapidapi-platforms.js';

export { detectPlatform };

export async function getUniversalInfo(url, { username, platform: forced } = {}) {
  const detected = forced
    ? { id: forced, section: forced }
    : detectPlatform(username || url);

  if (!detected) {
    throw Object.assign(new Error('Unsupported URL or platform.'), { code: 'UNSUPPORTED' });
  }

  const platform = detected.id;

  switch (platform) {
    case 'instagram-reel':
      return instagram.getReelInfo(url);

    case 'instagram-story':
      return instagram.getStoryInfo(url, username || detected.username);

    case 'youtube-shorts':
    case 'tiktok':
    case 'pinterest':
    case 'twitter':
    case 'facebook':
      try {
        return await ytdlpUniversal.getInfo(url, platform);
      } catch (err) {
        if (platform === 'tiktok' && rapidapiPlatforms.isTiktokAvailable()) {
          return rapidapiPlatforms.getTiktokInfo(url);
        }
        throw classifyUniversalError(err);
      }

    default:
      throw Object.assign(new Error('Platform not supported in universal downloader.'), { code: 'UNSUPPORTED' });
  }
}

export async function downloadUniversal(url, format, platform, res, { username, storyId } = {}) {
  switch (platform) {
    case 'instagram-reel':
      return instagram.downloadReel(url, res);

    case 'instagram-story':
      if (format.id === 'all-zip' || format.type === 'archive') {
        return instagram.downloadStoriesZip(url, username, res);
      }
      return instagram.downloadStoryItem(url, storyId, username, res);

    case 'youtube-shorts':
    case 'tiktok':
    case 'pinterest':
    case 'twitter':
    case 'facebook':
      return ytdlpUniversal.streamUniversalDownload(url, { ...format, title: format.title }, platform, res);

    default:
      throw Object.assign(new Error('Platform not supported.'), { code: 'UNSUPPORTED' });
  }
}

export function classifyUniversalError(err) {
  const msg = (err.message || '').toLowerCase();
  const code = err.code;

  if (code === 'PRIVATE' || msg.includes('private')) {
    return Object.assign(new Error('This account is private.'), { code: 'PRIVATE' });
  }
  if (code === 'EXPIRED' || msg.includes('expired') || msg.includes('no active stories')) {
    return Object.assign(new Error('Stories have expired or are unavailable.'), { code: 'EXPIRED' });
  }
  if (code === 'RATE_LIMITED' || msg.includes('rate limit') || msg.includes('too many')) {
    return Object.assign(new Error('Rate limit reached. Please wait and try again.'), { code: 'RATE_LIMITED', retryAfter: 60 });
  }
  if (msg.includes('geo') || msg.includes('region') || msg.includes('not available in your country')) {
    return Object.assign(new Error('This content is geo-restricted in your region.'), { code: 'GEO_RESTRICTED' });
  }
  if (code === 'UNSUPPORTED') return err;
  return Object.assign(new Error(err.message || 'Download failed.'), { code: code || 'UNKNOWN' });
}