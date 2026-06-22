#!/usr/bin/env bash
# Production deploy — target < 60 seconds
# Usage: bash /var/www/vidinsecs/deploy/hetzner/deploy.sh

set -euo pipefail

APP_DIR=/var/www/vidinsecs
START=$(date +%s)

cd "$APP_DIR"

echo "==> Pull latest"
git fetch origin main
git reset --hard origin/main

echo "==> Install dependencies"
npm run install:all --silent

echo "==> Build frontend"
VITE_SITE_URL="${VITE_SITE_URL:-https://vidinsecs.com}" \
VITE_GITHUB_URL="${VITE_GITHUB_URL:-https://github.com/umarmirza2021/youtube-video-downloader}" \
npm run build --silent

echo "==> Update yt-dlp"
curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp

echo "==> Reload PM2"
pm2 startOrReload "$APP_DIR/deploy/hetzner/ecosystem.config.cjs" --update-env
pm2 save

echo "==> Reload Nginx"
nginx -t && systemctl reload nginx

if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ -n "${CLOUDFLARE_ZONE_ID:-}" ]; then
  echo "==> Purge Cloudflare cache"
  curl -fsS -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' > /dev/null
  echo "Cache purged"
fi

END=$(date +%s)
echo "Deploy finished in $((END - START))s"