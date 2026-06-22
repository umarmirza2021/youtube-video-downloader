import { spawn } from 'child_process';
import { mkdir, readdir, stat, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { DOWNLOAD_FAST_ARGS } from './ytdlp-args.js';

function buildYtdlpArgs(url, format, outputTemplate) {
  const args = [...DOWNLOAD_FAST_ARGS, '--no-playlist'];

  if (format.type === 'audio' || format.ext === 'mp3') {
    args.push('-f', 'bestaudio', '-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else if (format.needsMerge) {
    args.push('-f', format.id, '--merge-output-format', 'mp4');
  } else {
    args.push('-f', format.id);
  }

  args.push('-o', outputTemplate, url);
  return args;
}

function runYtdlpToFile(args, timeoutMs = 600000) {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stderr = '';

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('Download timed out'));
    }, timeoutMs);

    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stderr);
      else reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
    });
  });
}

async function findOutputFile(dir) {
  const entries = await readdir(dir);
  const files = [];

  for (const name of entries) {
    const full = path.join(dir, name);
    const info = await stat(full);
    if (info.isFile() && info.size > 1000) {
      files.push({ full, size: info.size, mtime: info.mtimeMs });
    }
  }

  if (!files.length) throw new Error('No output file produced');
  files.sort((a, b) => b.mtime - a.mtime);
  return files[0].full;
}

export async function downloadToTempFile(url, format) {
  const base = process.env.TEMP_DOWNLOAD_DIR || path.join(os.tmpdir(), 'vidinsecs');
  const workDir = path.join(base, randomUUID());
  await mkdir(workDir, { recursive: true });

  const template = path.join(workDir, '%(title).80s.%(ext)s');

  try {
    await runYtdlpToFile(buildYtdlpArgs(url, format, template));
    const filePath = await findOutputFile(workDir);
    const ext = path.extname(filePath).slice(1) || format.ext || 'mp4';

    return {
      filePath,
      ext,
      cleanup: async () => {
        try {
          await rm(workDir, { recursive: true, force: true });
        } catch {
          // ignore cleanup errors
        }
      },
    };
  } catch (err) {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}