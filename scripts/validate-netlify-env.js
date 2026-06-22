/**
 * Fails Netlify build if VITE_API_URL is missing.
 * Netlify sets NETLIFY=true during builds.
 */
const isNetlify = process.env.NETLIFY === 'true';
const apiUrl = process.env.VITE_API_URL;

if (isNetlify && !apiUrl) {
  console.error('\n❌ BUILD FAILED: VITE_API_URL is not set.\n');
  console.error('Fix: Netlify → Site configuration → Environment variables');
  console.error('Add:  VITE_API_URL = https://YOUR-RENDER-APP.onrender.com/api');
  console.error('Then: Trigger deploy → Clear cache and deploy\n');
  process.exit(1);
}

if (apiUrl && !apiUrl.endsWith('/api')) {
  console.warn(`⚠️  VITE_API_URL should end with /api (got: ${apiUrl})`);
}

if (apiUrl) {
  console.log(`✓ VITE_API_URL = ${apiUrl}`);
}