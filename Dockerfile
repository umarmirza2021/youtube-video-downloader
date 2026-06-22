# Full-stack: React UI + Express API
# Render Dockerfile Path: Dockerfile (default)
FROM node:20-bookworm-slim AS client-build
WORKDIR /app
COPY scripts/generate-seo-files.js ./scripts/
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci
COPY client ./
ARG VITE_SITE_URL=https://youtube-video-downloader-r4v3.onrender.com
ARG VITE_GITHUB_URL=https://github.com/umarmirza2021/youtube-video-downloader
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_GITHUB_URL=$VITE_GITHUB_URL
RUN node ../scripts/generate-seo-files.js && npm run build \
  && test -f dist/index.html \
  && ls dist/assets/*.js \
  && ls -la dist/assets/

FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip ffmpeg curl ca-certificates \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
     -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && pip3 install instaloader --break-system-packages \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server ./

# Copy frontend into server dir (reliable path for production)
COPY --from=client-build /app/client/dist ./client-dist
RUN test -f client-dist/index.html && ls -la client-dist/assets/

ENV NODE_ENV=production
ENV STATIC_DIR=/app/server/client-dist
EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:${PORT:-10000}/api/health || exit 1

CMD ["node", "index.js"]