import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync } from 'fs';
import apiRoutes from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = process.env.STATIC_DIR || path.join(__dirname, '..', 'client', 'dist');
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.TUNNEL_MODE === '1' && /\.trycloudflare\.com$/.test(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const rateWindow = parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10);
const rateMax = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const downloadMax = parseInt(process.env.DOWNLOAD_RATE_LIMIT_MAX || '20', 10);

const limiter = rateLimit({
  windowMs: rateWindow,
  max: rateMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
});

const downloadLimiter = rateLimit({
  windowMs: rateWindow,
  max: downloadMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Download limit reached. Please try again later.', code: 'RATE_LIMITED' },
});

app.use('/api', limiter);
app.use('/api/download', downloadLimiter);
app.use('/api/universal/download', downloadLimiter);
app.use('/api', apiRoutes);

if (existsSync(distPath)) {
  const assetsDir = path.join(distPath, 'assets');
  const assets = existsSync(assetsDir) ? readdirSync(assetsDir) : [];
  console.log(`Frontend ready: ${assets.length} assets in client/dist/assets`);
  app.use(express.static(distPath, { maxAge: isProduction ? '1d' : 0, fallthrough: true }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    // Don't SPA-fallback missing static files (e.g. /assets/*.js)
    if (/\.[a-zA-Z0-9]+$/.test(req.path)) return res.status(404).send('Not found');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!existsSync(distPath)) {
  console.error('ERROR: frontend not found at', distPath, '— redeploy with Dockerfile (not Dockerfile.api)');
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (existsSync(distPath)) console.log('Serving frontend from client/dist');
});