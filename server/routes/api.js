import { Router } from 'express';
import * as downloader from '../services/downloader.js';
import { checkYtdlp } from '../services/ytdlp.js';
import * as rapidapi from '../services/rapidapi.js';
import * as universal from '../services/universal.js';
import * as instagram from '../services/instagram.js';
import { resolveFormat } from '../services/format-map.js';

const router = Router();

function isValidYoutubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|playlist\?)|youtu\.be\/)/.test(url);
}

function parseFormatFromRequest(req) {
  const body = req.body || {};
  const query = req.query || {};

  if (body.format) {
    return resolveFormat(typeof body.format === 'string' ? JSON.parse(body.format) : body.format);
  }

  if (query.format) {
    try {
      const parsed = typeof query.format === 'string' ? JSON.parse(query.format) : query.format;
      return resolveFormat(parsed);
    } catch {
      return null;
    }
  }

  return resolveFormat({
    quality: query.quality || body.quality,
    formatId: query.formatId || body.formatId,
    ext: query.ext || body.ext,
    type: query.type || body.type,
    needsMerge: query.needsMerge || body.needsMerge,
    convertHorizontal: query.convertHorizontal || body.convertHorizontal,
    watermark: query.watermark || body.watermark,
    title: query.title || body.title || 'video',
  });
}

async function handleDownload(req, res) {
  const url = req.body?.url || req.query?.url;
  const format = parseFormatFromRequest(req);

  if (!isValidYoutubeUrl(url)) {
    return res.status(400).json({
      error: 'Invalid YouTube URL',
      code: 'INVALID_URL',
    });
  }

  if (!format?.id) {
    return res.status(400).json({
      error: 'Quality is required (e.g. 720p, 480p, audio)',
      code: 'MISSING_FORMAT',
    });
  }

  try {
    await downloader.downloadVideo(url, format, res);
  } catch (err) {
    if (!res.headersSent) {
      const classified = downloader.classifyError(err);
      res.status(422).json({ error: classified.message, code: classified.code });
    }
  }
}

router.get('/health', async (_req, res) => {
  const ytdlpOk = await checkYtdlp();
  const instaOk = await instagram.checkInstaloader();
  res.json({
    status: 'ok',
    engines: {
      ytdlp: ytdlpOk,
      rapidapi: rapidapi.isAvailable(),
      instaloader: instaOk,
    },
  });
});

router.post('/detect', (req, res) => {
  const { url } = req.body;
  const platform = universal.detectPlatform(url);
  if (!platform) {
    return res.status(400).json({ error: 'Unsupported URL', code: 'UNSUPPORTED' });
  }
  res.json(platform);
});

router.post('/universal/info', async (req, res) => {
  const { url, username, platform } = req.body;
  if (!url && !username) {
    return res.status(400).json({ error: 'URL or username required', code: 'INVALID_URL' });
  }
  try {
    const info = await universal.getUniversalInfo(url, { username, platform });
    res.json(info);
  } catch (err) {
    const classified = universal.classifyUniversalError(err);
    const status = classified.code === 'INVALID_URL' ? 400 : 422;
    res.status(status).json({
      error: classified.message,
      code: classified.code,
      retryAfter: classified.retryAfter,
    });
  }
});

async function handleUniversalDownload(req, res) {
  const url = req.body?.url || req.query?.url;
  const platform = req.body?.platform || req.query?.platform;
  const username = req.body?.username || req.query?.username;
  const storyId = req.body?.storyId || req.query?.storyId;
  const format = parseFormatFromRequest(req);

  if (!platform) {
    return res.status(400).json({ error: 'Platform is required', code: 'MISSING_PLATFORM' });
  }

  if (!format?.id) {
    return res.status(400).json({ error: 'Quality is required', code: 'MISSING_FORMAT' });
  }

  try {
    await universal.downloadUniversal(url, format, platform, res, { username, storyId });
  } catch (err) {
    if (!res.headersSent) {
      const classified = universal.classifyUniversalError(err);
      res.status(422).json({
        error: classified.message,
        code: classified.code,
        retryAfter: classified.retryAfter,
      });
    }
  }
}

router.get('/universal/download', handleUniversalDownload);
router.post('/universal/download', handleUniversalDownload);

router.post('/info', async (req, res) => {
  const { url } = req.body;

  if (!isValidYoutubeUrl(url)) {
    return res.status(400).json({
      error: 'Invalid YouTube URL',
      code: 'INVALID_URL',
    });
  }

  try {
    const info = await downloader.getQuickVideoInfo(url);
    res.json(info);
  } catch (err) {
    const classified = downloader.classifyError(err);
    const status = classified.code === 'INVALID_URL' ? 400 : 422;
    res.status(status).json({ error: classified.message, code: classified.code });
  }
});

async function handleEnrich(req, res) {
  const url = req.body?.url || req.query?.url;

  if (!isValidYoutubeUrl(url)) {
    return res.status(400).json({
      error: 'Invalid YouTube URL',
      code: 'INVALID_URL',
    });
  }

  try {
    const info = await downloader.enrichVideoInfo(url);
    res.json(info);
  } catch (err) {
    const classified = downloader.classifyError(err);
    res.status(422).json({ error: classified.message, code: classified.code });
  }
}

router.get('/enrich', handleEnrich);
router.post('/enrich', handleEnrich);

router.get('/formats', async (req, res) => {
  const { url } = req.query;

  if (!isValidYoutubeUrl(url)) {
    return res.status(400).json({
      error: 'Invalid YouTube URL',
      code: 'INVALID_URL',
    });
  }

  try {
    const result = await downloader.getFormats(url);
    res.json(result);
  } catch (err) {
    const classified = downloader.classifyError(err);
    res.status(422).json({ error: classified.message, code: classified.code });
  }
});

router.get('/download', handleDownload);
router.post('/download', handleDownload);

export default router;