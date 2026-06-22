import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream, unlinkSync } from 'fs';

const execAsync = promisify(exec);
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as rapidapiPlatforms from './rapidapi-platforms.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, '..', 'scripts', 'instagram_fetch.py');

let instaloaderAvailable = null;

function runPython(args, { timeout = 45000 } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', [SCRIPT, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('Instagram fetch timed out'));
    }, timeout);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      try {
        const data = JSON.parse(stdout.trim() || '{}');
        if (data.error) reject(Object.assign(new Error(data.error), { code: data.code }));
        else if (code !== 0) reject(new Error(stderr.trim() || 'Instagram script failed'));
        else resolve(data);
      } catch {
        reject(new Error(stderr.trim() || stdout.trim() || 'Invalid Instagram response'));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function checkInstaloader() {
  if (instaloaderAvailable !== null) return instaloaderAvailable;
  try {
    await execAsync('python -c "import instaloader"');
    instaloaderAvailable = true;
  } catch {
    instaloaderAvailable = false;
  }
  return instaloaderAvailable;
}

export async function downloadStoriesZip(url, username, res) {
  const args = ['--mode', 'stories-zip'];
  if (url) args.push('--url', url);
  if (username) args.push('--username', username);

  const data = await runPython(args, { timeout: 120000 });
  const filePath = data.path;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${username || 'stories'}-stories.zip"`);
  const stream = createReadStream(filePath);
  stream.pipe(res);
  stream.on('close', () => {
    try { unlinkSync(filePath); } catch { /* ignore */ }
  });
}

function reelFormats() {
  return [{
    id: 'original',
    label: 'Original MP4',
    quality: 'original',
    ext: 'mp4',
    type: 'video',
    needsMerge: false,
  }];
}

export async function getReelInfo(url) {
  try {
    const data = await runPython(['--mode', 'reel-info', '--url', url]);
    return {
      ...data,
      formats: reelFormats(),
      description: data.caption,
    };
  } catch (err) {
    if (rapidapiPlatforms.isInstagramAvailable()) {
      return rapidapiPlatforms.getInstagramReel(url);
    }
    throw err;
  }
}

export async function getStoryInfo(url, username) {
  const args = ['--mode', 'story-info'];
  if (url) args.push('--url', url);
  if (username) args.push('--username', username);

  try {
    const data = await runPython(args);
    return {
      ...data,
      formats: [{
        id: 'all-zip',
        label: 'Download All (ZIP)',
        quality: 'all',
        ext: 'zip',
        type: 'archive',
      }],
    };
  } catch (err) {
    if (rapidapiPlatforms.isInstagramAvailable()) {
      return rapidapiPlatforms.getInstagramStories(url, username);
    }
    throw err;
  }
}

export async function downloadReel(url, res) {
  try {
    const data = await runPython(['--mode', 'download', '--url', url]);
    const filePath = data.path;
    const ext = filePath.endsWith('.mp4') ? 'mp4' : 'jpg';
    res.setHeader('Content-Type', ext === 'mp4' ? 'video/mp4' : 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="instagram-reel.${ext}"`);
    const stream = createReadStream(filePath);
    stream.pipe(res);
    stream.on('close', () => {
      try { unlinkSync(filePath); } catch { /* ignore */ }
    });
  } catch (err) {
    if (rapidapiPlatforms.isInstagramAvailable()) {
      return rapidapiPlatforms.downloadInstagramReel(url, res);
    }
    throw err;
  }
}

export async function downloadStoryItem(url, storyId, username, res) {
  const args = ['--mode', 'download', '--story-id', storyId, '--username', username];
  if (url) args.push('--url', url);

  const data = await runPython(args);
  const filePath = data.path;
  const ext = filePath.endsWith('.mp4') ? 'mp4' : 'jpg';
  res.setHeader('Content-Type', ext === 'mp4' ? 'video/mp4' : 'image/jpeg');
  res.setHeader('Content-Disposition', `attachment; filename="story-${storyId}.${ext}"`);
  createReadStream(filePath).pipe(res);
}