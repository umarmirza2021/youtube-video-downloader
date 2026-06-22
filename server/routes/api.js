import { Router } from 'express';
import * as downloader from '../services/downloader.js';
import { checkYtdlp } from '../services/ytdlp.js';
import * as rapidapi from '../services/rapidapi.js';
import * as universal from '../services/universal.js';
import * as instagram from '../services/instagram.js';

const router = Router();

function isValidYoutubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|playlist\?)|youtu\.be\/)/.test(url);
}

function parseFormatFromQuery(query) {
  if (query.formatId) {
    return {
      id: query.formatId,
      ext: query.ext || 'mp4',
      type: query.type || 'video',
      quality: query.quality || '',
      needsMerge: query.needsMerge === '1' || query.needsMerge === 'true',
      convertHorizontal: query.convertHorizontal === '1' || query.convertHorizontal === 'true',
      watermark: query.watermark === '1' || query.watermark === 'true',
      title: query.title || 'video',
    };
  }

  if (query.format) {
    try {
      return typeof query.format === 'string' ? JSON.parse(query.format) : query.format;
    } catch {
      return null;
    }
  }

  return null;
}

async function handleDownload(req, res) {
  const url = req.body?.url || req.query?.url;
  const format = req.body?.format || parseFormatFromQuery(req.query);

  if (!isValidYoutubeUrl(url)) {
    return res.status(400).json({
      error: 'Invalid YouTube URL',
      code: 'INVALID_URL',
    });
  }

  if (!format || !format.id) {
    return res.status(400).json({
      error: 'Format is required',
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
  const format = req.body?.format || parseFormatFromQuery(req.query);

  if (!platform) {
    return res.status(400).json({ error: 'Platform is required', code: 'MISSING_PLATFORM' });
  }

  if (!format?.id) {
    return res.status(400).json({ error: 'Format is required', code: 'MISSING_FORMAT' });
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

router.get('/enrich', async (req, res) => {
  const { url } = req.query;

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
});

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