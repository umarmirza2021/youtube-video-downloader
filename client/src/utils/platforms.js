export const PLATFORM_TABS = [
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    accent: 'from-pink-500 to-purple-600',
    border: 'border-pink-500/40',
    placeholder: 'Paste Instagram Reel URL…',
    hint: 'instagram.com/reel/…',
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    accent: 'from-purple-500 to-pink-500',
    border: 'border-purple-500/40',
    placeholder: 'Story URL or @username',
    hint: 'URL or username for active stories',
    supportsUsername: true,
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    accent: 'from-red-600 to-red-500',
    border: 'border-red-500/40',
    placeholder: 'Paste YouTube Shorts URL…',
    hint: 'youtube.com/shorts/…',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    accent: 'from-cyan-400 to-pink-500',
    border: 'border-cyan-500/40',
    placeholder: 'Paste TikTok video URL…',
    hint: 'tiktok.com/@user/video/…',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    accent: 'from-red-600 to-red-400',
    border: 'border-red-600/40',
    placeholder: 'Paste Pinterest pin URL…',
    hint: 'pinterest.com/pin/…',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    accent: 'from-zinc-600 to-zinc-400',
    border: 'border-zinc-500/40',
    placeholder: 'Paste tweet URL with video…',
    hint: 'x.com/user/status/…',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    accent: 'from-blue-600 to-blue-500',
    border: 'border-blue-500/40',
    placeholder: 'Paste Facebook video/reel URL…',
    hint: 'facebook.com/… or fb.watch/…',
  },
];

export function detectPlatform(input) {
  const url = (input || '').trim();
  if (!url) return null;

  if (/^@?[a-zA-Z0-9._]{1,30}$/.test(url.replace(/^@/, '')) && !url.includes('http')) {
    return { id: 'instagram-story', label: 'Instagram Story', section: 'instagram-story', username: url.replace(/^@/, '') };
  }

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if ((host.includes('youtube.com') || host === 'youtu.be') && /\/shorts\//.test(u.pathname)) {
      return { id: 'youtube-shorts', label: 'YouTube Shorts', section: 'youtube-shorts' };
    }
    if (host.includes('youtube.com') || host === 'youtu.be') {
      return { id: 'youtube', label: 'YouTube', section: 'hero' };
    }
    if (host === 'instagram.com') {
      if (/\/stories\//.test(u.pathname)) return { id: 'instagram-story', label: 'Instagram Story', section: 'instagram-story' };
      if (/\/reel\//.test(u.pathname) || /\/p\//.test(u.pathname)) return { id: 'instagram-reel', label: 'Instagram Reel', section: 'instagram-reel' };
    }
    if (host.includes('tiktok.com')) return { id: 'tiktok', label: 'TikTok', section: 'tiktok' };
    if (host.includes('pinterest.com') || host === 'pin.it') return { id: 'pinterest', label: 'Pinterest', section: 'pinterest' };
    if (host === 'twitter.com' || host === 'x.com') return { id: 'twitter', label: 'Twitter/X', section: 'twitter' };
    if (host.includes('facebook.com') || host === 'fb.watch') return { id: 'facebook', label: 'Facebook', section: 'facebook' };
  } catch {
    return null;
  }
  return null;
}

export function getPlatformTab(id) {
  return PLATFORM_TABS.find((p) => p.id === id);
}