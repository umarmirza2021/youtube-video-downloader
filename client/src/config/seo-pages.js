export const SEO_PAGES = [
  {
    key: 'home',
    path: '/',
    title: 'Free Video Downloader — YouTube, TikTok, Instagram Reels & More',
    description:
      'Download YouTube videos, Shorts, MP3, Instagram Reels, TikTok without watermark, Pinterest pins, Twitter/X and Facebook videos free online. Fast, no signup.',
    h1: 'Free Video Downloader',
    subtitle: 'YouTube, Instagram, TikTok, Pinterest & more — paste any link',
    platformId: null,
    keywords: 'video downloader, youtube downloader, tiktok downloader, instagram reel downloader',
    sections: ['overview', 'youtube', 'instagram', 'tiktok', 'other'],
  },
  {
    key: 'youtube',
    path: '/youtube-downloader',
    title: 'YouTube Video Downloader — MP4 & MP3 Online Free',
    description:
      'Download YouTube videos in 1080p, 720p, 480p MP4 or extract MP3 audio. Supports playlists. Free online YouTube downloader — no signup.',
    h1: 'YouTube Video Downloader',
    subtitle: 'Download videos, playlists & MP3 audio in HD',
    platformId: 'youtube',
    keywords: 'youtube downloader, youtube mp3, youtube mp4, download youtube video',
    sections: ['youtube', 'overview'],
  },
  {
    key: 'youtube-shorts',
    path: '/youtube-shorts-downloader',
    title: 'YouTube Shorts Downloader — Save Shorts as MP4 Free',
    description:
      'Download YouTube Shorts in HD MP4. Vertical or horizontal export. Free online YouTube Shorts downloader — paste link and save.',
    h1: 'YouTube Shorts Downloader',
    subtitle: 'Save Shorts in original quality — vertical or horizontal',
    platformId: 'youtube-shorts',
    keywords: 'youtube shorts downloader, download youtube shorts, shorts mp4',
    sections: ['youtube', 'overview'],
  },
  {
    key: 'tiktok',
    path: '/tiktok-downloader',
    title: 'TikTok Downloader — No Watermark HD Video Free',
    description:
      'Download TikTok videos without watermark in HD. Free online TikTok downloader — save MP4 to your phone or PC. No account required.',
    h1: 'TikTok Downloader',
    subtitle: 'Save TikTok videos with or without watermark in HD',
    platformId: 'tiktok',
    keywords: 'tiktok downloader, tiktok no watermark, download tiktok video',
    sections: ['tiktok', 'overview'],
  },
  {
    key: 'instagram-reel',
    path: '/instagram-reel-downloader',
    title: 'Instagram Reel Downloader — Save Reels MP4 Free',
    description:
      'Download Instagram Reels in original quality. Free online Instagram Reel downloader — paste reel URL and save MP4 instantly.',
    h1: 'Instagram Reel Downloader',
    subtitle: 'Download Reels in full quality — no login required',
    platformId: 'instagram-reel',
    keywords: 'instagram reel downloader, download instagram reel, reel saver',
    sections: ['instagram', 'overview'],
  },
  {
    key: 'instagram-story',
    path: '/instagram-story-downloader',
    title: 'Instagram Story Downloader — Save Stories Free Online',
    description:
      'Download Instagram Stories by URL or username. Save active stories as MP4 or ZIP. Free Instagram Story downloader online.',
    h1: 'Instagram Story Downloader',
    subtitle: 'Fetch active stories by URL or @username',
    platformId: 'instagram-story',
    keywords: 'instagram story downloader, download instagram story, story saver',
    sections: ['instagram', 'overview'],
  },
  {
    key: 'pinterest',
    path: '/pinterest-downloader',
    title: 'Pinterest Downloader — Save Pins & Videos Free',
    description:
      'Download Pinterest pins as full-resolution images or MP4 video. Free online Pinterest downloader — paste pin URL and save.',
    h1: 'Pinterest Downloader',
    subtitle: 'Save pins as HD images or MP4 video',
    platformId: 'pinterest',
    keywords: 'pinterest downloader, download pinterest video, pinterest pin saver',
    sections: ['other', 'overview'],
  },
  {
    key: 'twitter',
    path: '/twitter-video-downloader',
    title: 'Twitter / X Video Downloader — Save Tweet Videos Free',
    description:
      'Download videos from Twitter and X tweets in HD. Free online Twitter video downloader — paste tweet URL and save MP4.',
    h1: 'Twitter / X Video Downloader',
    subtitle: 'Save tweet videos in multiple qualities',
    platformId: 'twitter',
    keywords: 'twitter video downloader, x video downloader, download tweet video',
    sections: ['other', 'overview'],
  },
  {
    key: 'facebook',
    path: '/facebook-video-downloader',
    title: 'Facebook Video Downloader — Save Videos & Reels Free',
    description:
      'Download public Facebook videos and reels in HD or SD. Free online Facebook video downloader — paste link and save MP4.',
    h1: 'Facebook Video Downloader',
    subtitle: 'Download public videos and reels in HD',
    platformId: 'facebook',
    keywords: 'facebook video downloader, download facebook reel, fb video saver',
    sections: ['other', 'overview'],
  },
];

export function getPageByPath(pathname) {
  const normalized = pathname.replace(/\/$/, '') || '/';
  return SEO_PAGES.find((p) => p.path === normalized) || SEO_PAGES[0];
}

export const PLATFORM_LINKS = SEO_PAGES.filter((p) => p.key !== 'home');