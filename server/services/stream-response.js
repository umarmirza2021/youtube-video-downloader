/**
 * Stream a child process stdout to HTTP response.
 * Headers are sent only after the first byte — prevents 0-byte downloads on failure.
 */
export function streamProcessToResponse(proc, res, { contentType, filename, classifyError }) {
  let started = false;
  let stderr = '';

  const start = () => {
    if (started) return;
    started = true;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-store');
  };

  proc.stdout.on('data', (chunk) => {
    start();
    res.write(chunk);
  });

  proc.stderr.on('data', (d) => {
    stderr += d.toString();
  });

  proc.on('close', (code) => {
    if (!started) {
      const msg = stderr.trim() || 'Download failed — try a lower quality';
      const classified = classifyError?.(msg) || { message: msg, code: 'DOWNLOAD_FAILED' };
      if (!res.headersSent) {
        res.status(422).json({ error: classified.message, code: classified.code });
      }
      return;
    }
    res.end();
    if (code !== 0) {
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