# VidInSecs — Start Here

Forget Render, tunnels, and R2 for now. Three steps only.

---

## Step 1 — Test on your PC (do this first)

**Requirements:** Node.js 20+, yt-dlp, ffmpeg

```powershell
winget install yt-dlp.yt-dlp Gyan.FFmpeg
cd C:\Users\Umar_\youtube-downloader
npm run local
```

Open **http://localhost:3000**

1. Paste a YouTube link
2. Wait for title + file sizes
3. Pick **360p** → Download
4. Confirm the file in your Downloads folder

**Health check:** http://localhost:3000/api/health  
Should show `"storage": "direct"` and `"ytdlp": true`

---

## Step 2 — Put it on a VPS (when Step 1 works)

1. Create **Hetzner CX21** (Ubuntu 22.04) — ~€4/mo
2. SSH in:

```bash
ssh root@YOUR_SERVER_IP
git clone https://github.com/umarmirza2021/youtube-video-downloader.git /var/www/vidinsecs
cd /var/www/vidinsecs
bash deploy/hetzner/setup-server.sh
cp deploy/hetzner/env.production.example server/.env
nano server/.env
```

3. In `.env` set at minimum:

```bash
SKIP_R2=1
NODE_ENV=production
PORT=3000
CLIENT_ORIGIN=http://YOUR_SERVER_IP
```

4. Deploy:

```bash
bash deploy/hetzner/deploy.sh
```

5. Visit `http://YOUR_SERVER_IP` — same tests as Step 1

---

## Step 3 — Domain + HTTPS (when Step 2 works)

1. Move **VidInSecs.com** DNS to Cloudflare (Namecheap → Cloudflare nameservers)
2. A record `@` and `www` → Hetzner IP (orange cloud ON)
3. On VPS:

```bash
certbot --nginx -d vidinsecs.com -d www.vidinsecs.com
```

4. Update `server/.env`: `CLIENT_ORIGIN=https://vidinsecs.com`
5. `pm2 restart vidinsecs`

SEO, R2, CI/CD — only after all three steps pass.

---

## Project folder

```
C:\Users\Umar_\youtube-downloader
```

## One command to run locally

```
npm run local
```