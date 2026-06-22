export const PLATFORMS = {
  youtube: { id: 'youtube', label: 'YouTube', section: 'hero' },
  'youtube-shorts': { id: 'youtube-shorts', label: 'YouTube Shorts', section: 'youtube-shorts' },
  'instagram-reel': { id: 'instagram-reel', label: 'Instagram Reel', section: 'instagram-reel' },
  'instagram-story': { id: 'instagram-story', label: 'Instagram Story', section: 'instagram-story' },
  tiktok: { id: 'tiktok', label: 'TikTok', section: 'tiktok' },
  pinterest: { id: 'pinterest', label: 'Pinterest', section: 'pinterest' },
  twitter: { id: 'twitter', label: 'Twitter/X', section: 'twitter' },
  facebook: { id: 'facebook', label: 'Facebook', section: 'facebook' },
};

export function detectPlatform(input) {
  const url = (input || '').trim();
  if (!url) return null;

  if (/^@?[a-zA-Z0-9._]{1,30}$/.test(url.replace(/^@/, '')) && !url.includes('http')) {
    return { ...PLATFORMS['instagram-story'], inputType: 'username', username: url.replace(/^@/, '') };
  }

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com') {
      if (/\/shorts\//.test(u.pathname)) {
        return { ...PLATFORMS['youtube-shorts'], inputType: 'url' };
      }
      if (!/[?&]list=/.test(url)) {
        return { ...PLATFORMS.youtube, section: 'hero', inputType: 'url' };
      }
      return { ...PLATFORMS.youtube, section: 'hero', inputType: 'url' };
    }

    if (host === 'instagram.com') {
      if (/\/stories\//.test(u.pathname)) {
        return { ...PLATFORMS['instagram-story'], inputType: 'url' };
      }
      if (/\/reel\//.test(u.pathname) || /\/reels\//.test(u.pathname)) {
        return { ...PLATFORMS['instagram-reel'], inputType: 'url' };
      }
      if (/\/p\//.test(u.pathname)) {
        return { ...PLATFORMS['instagram-reel'], inputType: 'url' };
      }
    }

    if (host === 'tiktok.com' || host === 'vm.tiktok.com' || host === 'vt.tiktok.com') {
      return { ...PLATFORMS.tiktok, inputType: 'url' };
    }

    if (host === 'pinterest.com' || host === 'pin.it') {
      return { ...PLATFORMS.pinterest, inputType: 'url' };
    }

    if (host === 'twitter.com' || host === 'x.com' || host === 'mobile.twitter.com') {
      return { ...PLATFORMS.twitter, inputType: 'url' };
    }

    if (host === 'facebook.com' || host === 'fb.watch' || host === 'm.facebook.com') {
      return { ...PLATFORMS.facebook, inputType: 'url' };
    }
  } catch {
    return null;
  }

  return null;
}

export function isYoutubeHero(url) {
  const p = detectPlatform(url);
  return p?.section === 'hero';
}