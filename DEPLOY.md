# Deploy Guide — Full-Stack on Render

One service serves **UI + API** on a single URL. No Netlify split, no `VITE_API_URL` required.

```
User → https://your-app.onrender.com
         ├── /           React app (9 SEO pages)
         └── /api/*      Express + yt-dlp + ffmpeg
```

---

## Step 1 — Push to GitHub

```powershell
cd "C:\Users\Umar_\youtube-downloader"
git init
git config user.email "you@example.com"
git config user.name "Your Name"
git add .
git commit -m "Media Downloader — open source launch"
```

Create a repo at [github.com/new](https://github.com/new), then:

```powershell
git remote add origin https://github.com/umarmirza2021/youtube-video-downloader.git
git branch -M main
git push -u origin main
```

Update `VITE_GITHUB_URL` in Render env vars and `README.md` with your real GitHub URL.

---

## Step 2 — Deploy on Render

1. [dashboard.render.com](https://dashboard.render.com) → sign up with GitHub
2. **New → Blueprint** → select your repo
3. Render reads `render.yaml` and creates **`media-downloader`**
4. Set environment variables when prompted:

| Key | Value | Required |
|-----|-------|----------|
| `CLIENT_ORIGIN` | `https://media-downloader.onrender.com` | Yes |
| `VITE_SITE_URL` | Same as your public URL | Yes (for SEO/sitemap) |
| `VITE_GITHUB_URL` | `https://github.com/umarmirza2021/youtube-video-downloader` | Recommended |
| `RAPIDAPI_KEY` | Your RapidAPI key | Optional |

5. Choose **Starter** plan ($7/mo) for always-on — recommended for a public SEO site
6. Wait for first Docker build (~10–15 min)
7. Test: `https://YOUR-APP.onrender.com/api/health`

### After deploy

- Open your Render URL — downloader should work immediately
- No CORS config needed when UI and API share the same origin

---

## Step 3 — Custom domain (recommended for SEO)

1. Buy a domain (Namecheap, Cloudflare, etc.)
2. Render → your service → **Settings → Custom Domains** → add domain
3. Point DNS to Render (CNAME)
4. Update env vars:
   - `CLIENT_ORIGIN=https://yourdomain.com`
   - `VITE_SITE_URL=https://yourdomain.com`
5. Trigger **Manual Deploy** to rebuild sitemap with new domain

---

## Step 4 — Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console)
2. Add property → your domain
3. Verify via DNS or HTML tag
4. **Sitemaps** → submit `https://yourdomain.com/sitemap.xml`
5. Request indexing for `/` and `/youtube-downloader`

### SEO pages included

- `/`
- `/youtube-downloader`
- `/youtube-shorts-downloader`
- `/tiktok-downloader`
- `/instagram-reel-downloader`
- `/instagram-story-downloader`
- `/pinterest-downloader`
- `/twitter-video-downloader`
- `/facebook-video-downloader`

---

## Step 5 — Cloudflare (optional, recommended at scale)

Put Cloudflare in front of your domain:

- Free CDN for static assets
- DDoS protection
- Faster global load times

---

## Costs (realistic)

| Stage | Monthly |
|-------|---------|
| Render Starter | ~$7 |
| Bandwidth (low traffic) | included |
| Bandwidth (growing) | $0.15/GB over limit |
| Domain | ~$10/year |

Video downloaders are bandwidth-heavy. Monitor Render **Metrics → Outbound Bandwidth**.

---

## Local production test

```powershell
npm run build:prod
$env:NODE_ENV="production"
$env:CLIENT_ORIGIN="http://localhost:3001"
npm start
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502 on first load | Render waking up — use Starter plan |
| Downloads fail | Check Render logs; verify yt-dlp/ffmpeg in Docker build |
| Wrong sitemap domain | Set `VITE_SITE_URL` and redeploy |
| CORS error | Set `CLIENT_ORIGIN` to exact site URL |
| Instagram fails | Public content only; private accounts won't work |

---

## Split deploy (Netlify + API) — legacy

If you prefer Netlify for frontend only, see `Dockerfile.api` and `deploy/netlify.env.example`. Requires `VITE_API_URL` pointing to a separate Render API service. **Not recommended** — use full-stack deploy above.