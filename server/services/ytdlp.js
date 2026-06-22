import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

let ytdlpAvailable = null;

const FAST_ARGS = [
  '--no-warnings',
  '--no-call-home',
  '--extractor-args', 'youtube:player_client=android,web',
  '--socket-timeout', '15',
];

const DOWNLOAD_FAST_ARGS = [
  ...FAST_ARGS,
  '--concurrent-fragments', '8',
  '--http-chunk-size', '10485760',
  '--retries', '3',
  '--fragment-retries', '3',
  '--no-mtime',
  '--no-part',
];

export async function checkYtdlp() {
  if (ytdlpAvailable !== null) return ytdlpAvailable;
  try {
    await execAsync('yt-dlp --version');
    ytdlpAvailable = true;
  } catch {
    ytdlpAvailable = false;
  }
  return ytdlpAvailable;
}

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

function isPlaylistUrl(url) {
  return /[?&]list=/.test(url) || /\/playlist/.test(url);
}

function parseDuration(seconds) {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  if (!bytes) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function buildFormatOptions(formats) {
  const options = [];
  const heights = [1080, 720, 480, 360];

  for (const height of heights) {
    const muxed = formats
      .filter((f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none' && f.height === height && f.ext === 'mp4')
      .sort((a, b) => (b.tbr || 0) - (a.tbr || 0))[0];

    if (muxed) {
      const size = muxed.filesize || muxed.filesize_approx || null;
      options.push({
        id: muxed.format_id,
        label: `${height}p MP4`,
        quality: `${height}p`,
        ext: 'mp4',
        type: 'video',
        filesize: size,
        filesizeFormatted: formatFileSize(size),
        needsMerge: false,
      });
      continue;
    }

    const videoFmt = formats
      .filter((f) => f.vcodec && f.vcodec !== 'none' && f.height === height && f.ext === 'mp4')
      .sort((a, b) => (b.tbr || 0) - (a.tbr || 0))[0];

    if (videoFmt) {
      const audioFmt = formats
        .filter((f) => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
        .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

      const needsMerge = videoFmt.acodec === 'none' || !videoFmt.acodec;
      const formatId = needsMerge && audioFmt
        ? `${videoFmt.format_id}+${audioFmt.format_id}`
        : videoFmt.format_id;

      const size = (videoFmt.filesize || videoFmt.filesize_approx || 0) +
        (needsMerge && audioFmt ? (audioFmt.filesize || audioFmt.filesize_approx || 0) : 0);

      options.push({
        id: formatId,
        label: `${height}p MP4`,
        quality: `${height}p`,
        ext: 'mp4',
        type: 'video',
        filesize: size || null,
        filesizeFormatted: formatFileSize(size),
        needsMerge,
      });
    }
  }

  const audioFmt = formats
    .filter((f) => f.acodec && f.acodec !== 'none')
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

  if (audioFmt) {
    const size = audioFmt.filesize || audioFmt.filesize_approx || null;
    options.push({
      id: 'bestaudio',
      label: 'MP3 Audio',
      quality: 'audio',
      ext: 'mp3',
      type: 'audio',
      filesize: size,
      filesizeFormatted: formatFileSize(size),
      needsMerge: false,
    });
  }

  return options;
}

function mapVideoInfo(data) {
  const formats = data.formats || [];
  return {
    id: data.id,
    title: data.title,
    channel: data.uploader || data.channel || 'Unknown',
    thumbnail: data.thumbnail,
    duration: parseDuration(data.duration),
    durationSeconds: data.duration,
    description: data.description?.slice(0, 200),
    viewCount: data.view_count,
    formats: buildFormatOptions(formats),
    isPlaylist: false,
    engine: 'ytdlp',
  };
}

export async function getVideoInfo(url) {
  const available = await checkYtdlp();
  if (!available) throw new Error('yt-dlp is not installed');

  if (isPlaylistUrl(url)) {
    return getPlaylistInfo(url);
  }

  const { stdout } = await runYtdlp([
    '--dump-single-json',
    '--no-playlist',
    '--no-check-formats',
    url,
  ], { timeout: 25000 });

  const data = JSON.parse(stdout);
  return mapVideoInfo(data);
}

export async function getPlaylistInfo(url) {
  const { stdout } = await runYtdlp([
    '--dump-single-json',
    '--flat-playlist',
    '--lazy-playlist',
    url,
  ], { timeout: 20000 });

  const data = JSON.parse(stdout);
  const entries = data.entries || [];

  const videos = [];
  for (const entry of entries.slice(0, 50)) {
    if (entry.id && entry.title) {
      videos.push({
        id: entry.id,
        title: entry.title,
        channel: entry.uploader || entry.channel || data.uploader || 'Unknown',
        thumbnail: entry.thumbnails?.[0]?.url || entry.thumbnail
          || `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
        duration: parseDuration(entry.duration),
        url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
      });
    }
  }

  return {
    id: data.id,
    title: data.title || 'Playlist',
    channel: data.uploader || data.channel || 'Unknown',
    thumbnail: data.thumbnails?.[0]?.url || data.thumbnail,
    duration: null,
    isPlaylist: true,
    videoCount: entries.length,
    videos,
    formats: [],
    engine: 'ytdlp',
  };
}

export async function getFormats(url) {
  const info = await getVideoInfo(url);
  return {
    formats: info.formats,
    title: info.title,
    engine: 'ytdlp',
  };
}

export function streamDownload(url, format, { onError } = {}) {
  const args = [...DOWNLOAD_FAST_ARGS, '--no-playlist'];

  if (format.type === 'audio' || format.ext === 'mp3') {
    args.push('-f', 'bestaudio', '-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else if (format.needsMerge) {
    args.push('-f', format.id, '--merge-output-format', 'mp4');
  } else {
    args.push('-f', format.id);
  }

  args.push('-o', '-', url);

  const proc = spawn('yt-dlp', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  proc.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    if (/ERROR/i.test(text) && onError) {
      onError(text.trim());
    }
  });

  proc.on('error', (err) => {
    if (onError) onError(err.message);
  });

  return proc;
}

export function classifyError(message) {
  const lower = message.toLowerCase();
  if (lower.includes('private')) return { code: 'PRIVATE', message: 'This video is private.' };
  if (lower.includes('age') || lower.includes('confirm your age')) return { code: 'AGE_RESTRICTED', message: 'This video is age-restricted and cannot be downloaded.' };
  if (lower.includes('unavailable') || lower.includes('not available')) return { code: 'UNAVAILABLE', message: 'This video is unavailable.' };
  if (lower.includes('invalid') || lower.includes('unsupported url')) return { code: 'INVALID_URL', message: 'Invalid YouTube URL.' };
  if (lower.includes('copyright') || lower.includes('blocked')) return { code: 'BLOCKED', message: 'This video is blocked or restricted in your region.' };
  return { code: 'UNKNOWN', message: message || 'An unknown error occurred.' };
}