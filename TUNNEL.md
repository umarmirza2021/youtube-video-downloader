# Cloudflare Tunnel — free, fast, public URL

Run the downloader on **your PC** (local speed) and expose it to the internet for free via Cloudflare Tunnel.

## Quick start (no account, random URL)

```powershell
cd C:\Users\Umar_\youtube-downloader
npm run tunnel
```

1. Wait for **"PUBLIC URL: https://….trycloudflare.com"**
2. Open that URL in any browser — share it with friends
3. **Keep the terminal open** — closing it stops the tunnel

The URL changes each time you restart. No Cloudflare account needed.

### Prerequisites

```powershell
winget install yt-dlp.yt-dlp Gyan.FFmpeg
```

Node.js 20+ is also required.

## Permanent URL (free Cloudflare account + domain)

If you own a domain (e.g. `yourdomain.com`) on Cloudflare:

```powershell
.\scripts\setup-named-tunnel.ps1 -Hostname dl.yourdomain.com
```

Then follow the printed steps to run the named tunnel.

## How it works

```
Internet  →  Cloudflare  →  cloudflared (your PC)  →  localhost:3001  →  yt-dlp
```

- **Fast** — yt-dlp runs on your machine, not a slow cloud container
- **Free** — Cloudflare Tunnel has no bandwidth charge
- **Trade-off** — your PC must stay on and the tunnel terminal must stay open

## vs Render

| | Local + Tunnel | Render free |
|--|----------------|-------------|
| Speed | Fast | Slow (cold starts) |
| Cost | Free | Free |
| PC must stay on | Yes | No |
| URL | Changes (quick) or fixed (named) | Fixed |

## Troubleshooting

**"Server failed to start"** — Port 3001 in use. Close other terminals running the app.

**Downloads fail** — Ensure yt-dlp works: `yt-dlp --version`

**Tunnel URL not loading** — Wait 30 seconds after it appears; first request can be slow.