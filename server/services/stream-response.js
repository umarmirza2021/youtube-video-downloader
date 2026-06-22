/**
 * Stream a child process stdout to HTTP response.
 * Headers are sent immediately so browsers keep the download connection open
 * while yt-dlp/ffmpeg starts (can take 10–30s on cold servers).
 */
export function streamProcessToResponse(proc, res, { contentType, filename, classifyError }) {
  let started = false;
  let stderr = '';
  let bytesWritten = 0;

  const start = () => {
    if (started) return;
    started = true;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-store');
    if (!res.headersSent) {
      res.status(200);
      if (typeof res.flushHeaders === 'function') res.flushHeaders();
    }
  };

  start();

  proc.stdout.on('data', (chunk) => {
    bytesWritten += chunk.length;
    res.write(chunk);
  });

  proc.stderr.on('data', (d) => {
    stderr += d.toString();
  });

  proc.on('close', (code) => {
    if (bytesWritten === 0) {
      const msg = stderr.trim() || 'Download failed — try 360p or 480p quality';
      const classified = classifyError?.(msg) || { message: msg, code: 'DOWNLOAD_FAILED' };
      if (!res.headersSent) {
        res.status(422).json({ error: classified.message, code: classified.code });
        return;
      }
      try {
        res.write(`Download failed: ${classified.message}`);
      } catch {
        // response already closed
      }
    }
    res.end();
    if (code !== 0 && bytesWritten > 0) {
      console.error('Download process exited', code, stderr.slice(0, 400));
    }
  });

  proc.on('error', (err) => {
    if (!started && !res.headersSent) {
      res.status(500).json({ error: err.message || 'Download failed' });
    }
  });

  res.on('close', () => {
    try {
      proc.kill('SIGKILL');
    } catch {
      // ignore
    }
  });
}