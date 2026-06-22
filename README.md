# Media Downloader

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Free, open-source online video downloader for **YouTube**, **YouTube Shorts**, **Instagram Reels & Stories**, **TikTok**, **Pinterest**, **Twitter/X**, and **Facebook**.

Paste any link → pick quality → download. No signup. Self-hostable.

**Live demo:** deploy your own instance (see [DEPLOY.md](DEPLOY.md))

---

## Features

- **YouTube** — videos, playlists, Shorts, MP3 audio (1080p–360p)
- **Instagram** — Reels, Stories (by URL or @username), ZIP batch
- **TikTok** — with or without watermark
- **Pinterest, Twitter/X, Facebook** — images and video
- Universal paste bar — auto-detects platform
- Instant preview + background format enrichment
- Download history (localStorage)
- SEO landing pages per platform (`/tiktok-downloader`, `/youtube-downloader`, …)
- Dark UI, mobile-friendly

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express |
| Engines | yt-dlp, ffmpeg, instaloader (Instagram), RapidAPI fallback |

## Quick start (local)

### Prerequisites

- Node.js 20+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg](https://ffmpeg.org/)

```powershell
winget install yt-dlp ffmpeg
```

### Run

```powershell
git clone https://github.com/umarmirza2021/media-downloader.git
cd media-downloader
npm run install:all
npm run dev:server   # Terminal 1 — API on :3001
npm run dev:client   # Terminal 2 — UI on :5173
```

Open http://localhost:5173

### Production (single port)

```powershell
npm run build:prod
$env:NODE_ENV="production"
npm start
```

Open http://localhost:3001 — UI + API together.

## Deploy to production

**Recommended:** [Render full-stack](DEPLOY.md) (one Docker service, one URL).

```powershell
# Push to GitHub, then Render → New → Blueprint → connect repo
```

Set these on Render:

| Variable | Example |
|----------|---------|
| `CLIENT_ORIGIN` | `https://media-downloader.onrender.com` |
| `VITE_SITE_URL` | `https://media-downloader.onrender.com` |
| `VITE_GITHUB_URL` | `https://github.com/umarmirza2021/media-downloader` |

Use the **Starter** plan (~$7/mo) for always-on performance. Free tier sleeps after 15 min idle.

## SEO pages

| URL | Target keywords |
|-----|-----------------|
| `/` | video downloader, multi-platform |
| `/youtube-downloader` | youtube downloader, youtube mp3 |
| `/youtube-shorts-downloader` | youtube shorts downloader |
| `/tiktok-downloader` | tiktok downloader no watermark |
| `/instagram-reel-downloader` | instagram reel downloader |
| `/instagram-story-downloader` | instagram story downloader |
| `/pinterest-downloader` | pinterest downloader |
| `/twitter-video-downloader` | twitter video downloader |
| `/facebook-video-downloader` | facebook video downloader |

Set `VITE_SITE_URL` before build to generate correct `sitemap.xml` and canonical URLs.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Engine status |
| `POST` | `/api/info` | YouTube metadata |
| `POST` | `/api/detect` | Detect platform from URL |
| `POST` | `/api/universal/info` | Multi-platform metadata |
| `GET` | `/api/download` | YouTube download stream |
| `GET` | `/api/universal/download` | Universal download stream |

## Environment variables

### Server (`server/.env`)

```
RAPIDAPI_KEY=           # optional fallback
RAPIDAPI_HOST=yt-api.p.rapidapi.com
CLIENT_ORIGIN=http://localhost:5173
```

### Client (build-time)

```
VITE_SITE_URL=https://yourdomain.com
VITE_GITHUB_URL=https://github.com/umarmirza2021/media-downloader
VITE_API_URL=           # only for split deploy (Netlify + Render)
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a pull request

## License

[MIT](LICENSE) — use freely, attribution appreciated.

## Disclaimer

For personal, non-commercial use. Respect copyright and each platform's Terms of Service. The authors are not responsible for misuse.