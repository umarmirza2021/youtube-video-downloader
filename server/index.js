import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync } from 'fs';
import apiRoutes from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'client', 'dist');
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();
app.set('trust proxy', 1);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
});

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
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
  console.error('ERROR: client/dist missing — use Dockerfile (not Dockerfile.api) and redeploy');
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (existsSync(distPath)) console.log('Serving frontend from client/dist');
});