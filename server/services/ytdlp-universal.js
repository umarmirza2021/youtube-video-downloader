import { spawn } from 'child_process';
import { checkYtdlp, streamDownload } from './ytdlp.js';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const FAST_ARGS = [
  '--no-warnings',
  '--no-call-home',
  '--socket-timeout', '15',
];

function runYtdlp(args, { timeout = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', [...FAST_ARGS, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('yt-dlp timed out'));
    }, timeout);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function formatFileSize(bytes) {
  if (!bytes) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function mapYtdlpData(data, platform) {
  const formats = data.formats || [];
  const base = {
    platform,
    id: data.id,
    title: data.title || data.description?.slice(0, 100) || 'Media',
    description: data.description?.slice(0, 300),
    channel: data.uploader || data.channel || data.creator || 'Unknown',
    thumbnail: data.thumbnail,
    duration: data.duration ? `${Math.floor(data.duration / 60)}:${String(Math.floor(data.duration % 60)).padStart(2, '0')}` : null,
    viewCount: data.view_count,
    likes: data.like_count,
    url: data.webpage_url || data.original_url,
    engine: 'ytdlp',
  };

  if (platform === 'tiktok') {
    return {
      ...base,
      caption: data.description,
      formats: [
        { id: 'best', label: 'No Watermark', quality: 'no-watermark', ext: 'mp4', type: 'video', needsMerge: false },
        { id: 'watermark', label: 'With Watermark', quality: 'watermark', ext: 'mp4', type: 'video', needsMerge: false, watermark: true },
      ],
      watermarkNote: 'Watermark-free downloads depend on TikTok availability.',
    };
  }

  if (platform === 'youtube-shorts') {
    return {
      ...base,
      formats: [
        { id: 'best[ext=mp4]', label: 'Vertical MP4 (9:16)', quality: 'vertical', ext: 'mp4', type: 'video', needsMerge: false },
        { id: 'best[ext=mp4]', label: 'Horizontal MP4 (16:9)', quality: 'horizontal', ext: 'mp4', type: 'video', needsMerge: false, convertHorizontal: true },
      ],
    };
  }

  if (platform === 'pinterest') {
    const isVideo = data.ext === 'mp4' || formats.some((f) => f.vcodec && f.vcodec !== 'none');
    return {
      ...base,
      mediaType: isVideo ? 'video' : 'image',
      formats: isVideo
        ? [{ id: 'best', label: 'Video MP4', quality: 'video', ext: 'mp4', type: 'video', needsMerge: false }]
        : [{ id: 'best', label: 'Full Resolution Image', quality: 'image', ext: 'jpg', type: 'image', needsMerge: false }],
    };
  }

  if (platform === 'twitter') {
    const heights = [1080, 720, 480];
    const opts = [];
    for (const h of heights) {
      const fmt = formats.find((f) => f.height === h && f.vcodec !== 'none');
      if (fmt) {
        opts.push({
          id: fmt.format_id,
          label: `${h}p MP4`,
          quality: `${h}p`,
          ext: 'mp4',
          type: 'video',
          filesizeFormatted: formatFileSize(fmt.filesize || fmt.filesize_approx),
          needsMerge: false,
        });
      }
    }
    if (!opts.length) {
      opts.push({ id: 'best', label: 'Best Quality', quality: 'best', ext: 'mp4', type: 'video', needsMerge: false });
    }
    return { ...base, tweetText: data.description, formats: opts };
  }

  if (platform === 'facebook') {
    return {
      ...base,
      formats: [
        { id: 'bestvideo[height<=1080]+bestaudio/best', label: 'HD', quality: 'hd', ext: 'mp4', type: 'video', needsMerge: true },
        { id: 'worstvideo+worstaudio/worst', label: 'SD', quality: 'sd', ext: 'mp4', type: 'video', needsMerge: true },
      ],
    };
  }

  return {
    ...base,
    formats: [{ id: 'best', label: 'Best Quality', quality: 'best', ext: 'mp4', type: 'video', needsMerge: false }],
  };
}

export async function getInfo(url, platform) {
  const available = await checkYtdlp();
  if (!available) throw new Error('yt-dlp is not installed');

  const { stdout } = await runYtdlp(['--dump-single-json', '--no-playlist', url]);
  const data = JSON.parse(stdout);
  return mapYtdlpData(data, platform);
}

export function streamUniversalDownload(url, format, platform, res) {
  const ext = format.ext || 'mp4';
  const safeTitle = (format.title || 'download').replace(/[^\w\s-]/g, '').slice(0, 60);
  const filename = `${safeTitle}.${ext}`;

  if (format.convertHorizontal && platform === 'youtube-shorts') {
    return streamWithHorizontalConvert(url, format, res, filename);
  }

  if (platform === 'tiktok' && format.watermark) {
    format = { ...format, id: 'watermark' };
  } else if (platform === 'tiktok') {
    format = { ...format, id: 'best' };
  }

  const mime = ext === 'mp3' ? 'audio/mpeg' : ext === 'jpg' || ext === 'png' ? 'image/jpeg' : 'video/mp4';
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Transfer-Encoding', 'chunked');

  const proc = streamDownload(url, format, {});
  proc.stdout.pipe(res, { highWaterMark: 1024 * 1024 });
  proc.on('close', (code) => {
    if (code !== 0 && !res.headersSent) res.status(500).json({ error: 'Download failed' });
  });
  res.on('close', () => proc.kill());
  return proc;
}

function streamWithHorizontalConvert(url, format, res, filename) {
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Transfer-Encoding', 'chunked');

  const ytdlpProc = spawn('yt-dlp', [
    ...FAST_ARGS, '-f', format.id, '-o', '-', '--no-playlist', url,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  const ffmpegProc = spawn('ffmpeg', [
    '-i', 'pipe:0',
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black',
    '-c:a', 'copy',
    '-f', 'mp4',
    '-movflags', 'frag_keyframe+empty_moov',
    'pipe:1',
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  ytdlpProc.stdout.pipe(ffmpegProc.stdin);
  ffmpegProc.stdout.pipe(res);

  const cleanup = () => {
    ytdlpProc.kill();
    ffmpegProc.kill();
  };
  res.on('close', cleanup);
  ytdlpProc.on('error', cleanup);
  ffmpegProc.on('error', cleanup);
}