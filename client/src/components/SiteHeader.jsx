import { Link } from 'react-router-dom';
import EngineStatus from './EngineStatus';
import { SITE_NAME } from '../config/site.js';

export default function SiteHeader({ page, engines }) {
  return (
    <header className="border-b border-yt-border bg-yt-dark/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
        <Link to="/" className="w-9 h-9 bg-yt-red rounded-lg flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zM9 16.5V7.5l6.5 4.5-6.5 4.5z" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to="/" className="block hover:opacity-90 transition-opacity">
            <h1 className="text-xl font-bold tracking-tight truncate">{page?.h1 || SITE_NAME}</h1>
            <p className="text-xs text-yt-muted truncate">{page?.subtitle || 'YouTube + Instagram, TikTok, Pinterest & more'}</p>
          </Link>
        </div>
        <EngineStatus engines={engines} />
      </div>
    </header>
  );
}