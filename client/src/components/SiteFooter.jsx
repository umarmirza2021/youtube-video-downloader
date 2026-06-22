import { Link } from 'react-router-dom';
import { PLATFORM_LINKS } from '../config/seo-pages.js';
import { getGitHubUrl } from '../config/site.js';

export default function SiteFooter() {
  const githubUrl = getGitHubUrl();

  return (
    <footer className="border-t border-yt-border bg-yt-dark/50 mt-12">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h2 className="text-sm font-semibold text-yt-text mb-3">Download by platform</h2>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            {PLATFORM_LINKS.map((page) => (
              <Link
                key={page.key}
                to={page.path}
                className="text-yt-muted hover:text-yt-text transition-colors"
              >
                {page.h1}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-yt-muted">
          <p>For personal use only. Respect copyright and platform Terms of Service.</p>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-yt-border hover:border-yt-muted hover:text-yt-text transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.515.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.635.24 2.85.12 3.15.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Open source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}