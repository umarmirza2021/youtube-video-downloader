export default function UrlInput({ value, onChange, onSubmit, loading, onPaste }) {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste YouTube video or playlist URL..."
            className="w-full bg-yt-card border border-yt-border rounded-xl px-4 py-3.5 pr-12 text-yt-text placeholder:text-yt-muted focus:outline-none focus:ring-2 focus:ring-yt-red/50 focus:border-yt-red transition-all"
            disabled={loading}
          />
          <button
            type="button"
            onClick={onPaste}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-yt-muted hover:text-yt-text transition-colors rounded-lg hover:bg-yt-hover"
            title="Paste from clipboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
        </div>
        <button type="submit" disabled={loading || !value.trim()} className="btn-primary whitespace-nowrap">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Fetching...
            </span>
          ) : (
            'Get Video'
          )}
        </button>
      </div>
    </form>
  );
}