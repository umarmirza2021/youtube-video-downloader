# VidInSecs — Hetzner + Cloudflare Production Guide

Deploy **VidInSecs.com** on Hetzner CX21 with Cloudflare CDN, R2 storage, PM2, and Nginx.

---

## Architecture

```
User → Cloudflare CDN (SSL, DDoS, cache) → Hetzner VPS (Nginx → Node/PM2 → yt-dlp)
                                              ↓
                                    Cloudflare R2 (temp files, 1h lifecycle)
```

---

## Part 1 — Cloudflare DNS (Namecheap → Cloudflare)

### 1. Add domain to Cloudflare

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) (Free plan)
2. **Add a site** → enter `vidinsecs.com`
3. Cloudflare scans existing DNS records — confirm them
4. Cloudflare shows **two nameservers** (e.g. `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`)

### 2. Update Namecheap nameservers

1. Namecheap → Domain List → **vidinsecs.com** → Manage
2. **Nameservers** → Custom DNS
3. Paste Cloudflare nameservers → Save
4. Wait 5–30 minutes for propagation

### 3. DNS A records (Cloudflare Dashboard → DNS → Records)

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `YOUR_HETZNER_IP` | Proxied (orange cloud) |
| A | `www` | `YOUR_HETZNER_IP` | Proxied |
| CNAME | `downloads` | R2 public bucket domain (see R2 section) | Proxied |

---

## Part 2 — Cloudflare SSL & Security (Free Plan)

**SSL/TLS → Overview**
- Encryption mode: **Full (strict)** (after Certbot on VPS)

**SSL/TLS → Edge Certificates**
- ✅ Always Use HTTPS
- ✅ Automatic HTTPS Rewrites
- ✅ HSTS (Enable, max-age 31536000, include subdomains)

**Security → Settings**
- Security Level: **Medium**
- Bot Fight Mode: **On**

**Analytics**
- Enabled by default on Free plan

### Cache Rules (replaces legacy Page Rules)

**Rule 1 — Cache static assets**
- When: URI Path contains `/assets/` OR ends with `.js`, `.css`, `.png`, `.jpg`, `.svg`, `.woff2`
- Then: Cache eligibility = Eligible, Edge TTL = 4 hours

**Rule 2 — Bypass API cache**
- When: URI Path starts with `/api/`
- Then: Cache eligibility = Bypass cache

---

## Part 3 — Cloudflare R2 (optional — skip for now)

**Skip R2 for now?** Add this to `server/.env` on the VPS:

```bash
SKIP_R2=1
```

Downloads will stream **directly from the VPS** (same as local testing). No R2 bucket needed. You can enable R2 later by filling in the keys and setting `SKIP_R2=0`.

If R2 is configured but upload fails, the app **automatically falls back** to direct VPS streaming.

---

### Create bucket (when ready)

1. Cloudflare Dashboard → **R2** → Create bucket
2. Name: `vidinsecs-downloads`
3. Location: Automatic

### Lifecycle rule (auto-delete after 1 hour)

R2 → bucket → **Settings** → **Lifecycle rules** → Add rule:
- Prefix: `downloads/`
- Delete objects after: **1 day** (R2 minimum; use 1 day — or use hourly cleanup cron on VPS as backup)

> Note: R2 lifecycle minimum is 1 day on some plans. Files are never stored on VPS disk regardless.

### API tokens

R2 → **Manage R2 API Tokens** → Create token:
- Permissions: Object Read & Write
- Bucket: `vidinsecs-downloads`

Save: Access Key ID, Secret Access Key, Account ID

### Public access (choose one)

**Option A — Presigned URLs (default, no public bucket)**
- Leave `R2_PUBLIC_URL` empty in `.env`
- App generates 1-hour signed download links

**Option B — Custom domain**
1. R2 → bucket → Settings → Public access → Connect domain `downloads.vidinsecs.com`
2. Set `R2_PUBLIC_URL=https://downloads.vidinsecs.com` in `.env`

---

## Part 4 — Hetzner VPS

### Create server

1. [console.hetzner.cloud](https://console.hetzner.cloud) → New Project
2. **Add Server**
   - Location: closest to users
   - Image: **Ubuntu 22.04**
   - Type: **CX21** (2 vCPU, 4 GB RAM)
   - SSH key: add your public key
3. Note the **IPv4 address** → use in Cloudflare A records

### Initial setup (SSH as root)

```bash
ssh root@YOUR_HETZNER_IP
git clone https://github.com/umarmirza2021/youtube-video-downloader.git /var/www/vidinsecs
cd /var/www/vidinsecs
bash deploy/hetzner/setup-server.sh
```

### Environment file

```bash
cp deploy/hetzner/env.production.example server/.env
nano server/.env   # fill R2 keys, RAPIDAPI_KEY, etc.
```

### First deploy (HTTP)

```bash
bash /var/www/vidinsecs/deploy/hetzner/deploy.sh
systemctl enable nginx && systemctl start nginx
```

### SSL certificate + full Nginx config

```bash
certbot --nginx -d vidinsecs.com -d www.vidinsecs.com
cp /var/www/vidinsecs/deploy/hetzner/nginx-vidinsecs.conf /etc/nginx/sites-available/vidinsecs.com
nginx -t && systemctl reload nginx
```

Set Cloudflare SSL mode to **Full (strict)** after Certbot completes.

### Verify
pm2 status
curl https://vidinsecs.com/api/health
```

---

## Part 5 — GitHub Actions CI/CD

Add these **GitHub Secrets** (repo → Settings → Secrets):

| Secret | Value |
|--------|-------|
| `HETZNER_HOST` | VPS IP address |
| `HETZNER_USER` | `root` (or deploy user) |
| `HETZNER_SSH_KEY` | Private SSH key (full PEM) |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID |

Every push to `main` runs `deploy.sh` automatically.

---

## Part 6 — UptimeRobot (free monitoring)

1. [uptimerobot.com](https://uptimerobot.com) → Add monitor
2. Type: **HTTPS**
3. URL: `https://vidinsecs.com/api/health`
4. Interval: **5 minutes**
5. Alert contacts: your email

---

## Part 7 — Verify checklist

- [ ] `https://vidinsecs.com` loads over HTTPS
- [ ] `/api/health` returns `{"status":"ok","engines":{"r2":true,...}}`
- [ ] Paste YouTube URL → title loads in ~2s
- [ ] Download returns R2 link (check `storage: "r2"` in network tab)
- [ ] `pm2 status` shows `vidinsecs` online
- [ ] `ufw status` shows only 22, 80, 443
- [ ] UptimeRobot shows UP
- [ ] GitHub Actions deploy succeeds

---

## Commands reference

```bash
# Manual deploy
bash /var/www/vidinsecs/deploy/hetzner/deploy.sh

# PM2 logs
pm2 logs vidinsecs

# PM2 monitor
pm2 monit

# Restart app
pm2 restart vidinsecs

# Update yt-dlp manually
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
```

---

## Costs

| Service | Cost |
|---------|------|
| Hetzner CX21 | ~€3.79/mo |
| Cloudflare Free | $0 |
| Cloudflare R2 Free tier | 10 GB, 1M ops/mo |
| UptimeRobot | $0 |
| **Total** | **~€4/mo** |