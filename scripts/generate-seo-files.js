/**
 * Generates sitemap.xml and robots.txt from VITE_SITE_URL before client build.
 */
const { writeFileSync } = require('fs');
const { join } = require('path');

const publicDir = join(__dirname, '..', 'client', 'public');
const siteUrl = (process.env.VITE_SITE_URL || 'https://REPLACE_WITH_YOUR_DOMAIN.com').replace(/\/$/, '');

const paths = [
  '/',
  '/youtube-downloader',
  '/youtube-shorts-downloader',
  '/tiktok-downloader',
  '/instagram-reel-downloader',
  '/instagram-story-downloader',
  '/pinterest-downloader',
  '/twitter-video-downloader',
  '/facebook-video-downloader',
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url>
    <loc>${siteUrl}${path === '/' ? '/' : path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

writeFileSync(join(publicDir, 'sitemap.xml'), sitemap);
writeFileSync(join(publicDir, 'robots.txt'), robots);
console.log(`✓ SEO files generated for ${siteUrl}`);