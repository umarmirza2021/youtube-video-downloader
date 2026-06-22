const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

function isConfigured(host) {
  return Boolean(RAPIDAPI_KEY && host);
}

async function rapidFetch(host, path, params = {}) {
  const url = new URL(`https://${host}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': host,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`RapidAPI error (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

export function isInstagramAvailable() {
  return isConfigured(process.env.RAPIDAPI_INSTAGRAM_HOST);
}

export function isTiktokAvailable() {
  return isConfigured(process.env.RAPIDAPI_TIKTOK_HOST);
}

export async function getInstagramReel(url) {
  const host = process.env.RAPIDAPI_INSTAGRAM_HOST;
  const data = await rapidFetch(host, '/reel', { url });
  return {
    platform: 'instagram-reel',
    title: data.caption?.slice(0, 200) || 'Instagram Reel',
    caption: data.caption,
    channel: data.username || data.owner,
    thumbnail: data.thumbnail || data.image,
    formats: [{ id: 'original', label: 'Original MP4', ext: 'mp4', type: 'video', needsMerge: false }],
    url,
    engine: 'rapidapi',
  };
}

export async function getInstagramStories(url, username) {
  const host = process.env.RAPIDAPI_INSTAGRAM_HOST;
  const data = await rapidFetch(host, '/stories', { username: username || '' });
  return {
    platform: 'instagram-story',
    title: `@${username} stories`,
    channel: username,
    stories: data.stories || [],
    thumbnail: data.stories?.[0]?.thumbnail,
    formats: [{ id: 'all-zip', label: 'Download All (ZIP)', ext: 'zip', type: 'archive' }],
    engine: 'rapidapi',
  };
}

export async function downloadInstagramReel(url, res) {
  const host = process.env.RAPIDAPI_INSTAGRAM_HOST;
  const data = await rapidFetch(host, '/reel/download', { url });
  const dl = await fetch(data.url || data.downloadUrl);
  if (!dl.ok) throw new Error('Failed to fetch reel');
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', 'attachment; filename="instagram-reel.mp4"');
  const reader = dl.body.getReader();
  const pump = async () => {
    const { done, value } = await reader.read();
    if (done) { res.end(); return; }
    res.write(Buffer.from(value));
    return pump();
  };
  await pump();
}

export async function getTiktokInfo(url) {
  const host = process.env.RAPIDAPI_TIKTOK_HOST;
  const data = await rapidFetch(host, '/video/info', { url });
  return {
    platform: 'tiktok',
    title: data.title || data.desc?.slice(0, 200) || 'TikTok Video',
    caption: data.desc,
    channel: data.author || data.username,
    thumbnail: data.cover || data.thumbnail,
    likes: data.likes || data.digg_count,
    formats: [
      { id: 'no-watermark', label: 'No Watermark', ext: 'mp4', type: 'video', needsMerge: false },
      { id: 'watermark', label: 'With Watermark', ext: 'mp4', type: 'video', needsMerge: false, watermark: true },
    ],
    url,
    engine: 'rapidapi',
    watermarkNote: 'Watermark-free downloads may not always be available.',
  };
}