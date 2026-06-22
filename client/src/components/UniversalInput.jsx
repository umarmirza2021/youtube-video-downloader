export default function UniversalInput({ value, onChange, onSubmit, onPaste }) {
  return (
    <div className="bg-gradient-to-r from-yt-card to-yt-hover/30 border border-yt-border rounded-2xl p-4">
      <p className="text-xs uppercase tracking-widest text-yt-muted mb-2">Universal Paste</p>
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste any supported URL — auto-detects platform…"
            className="w-full bg-yt-dark border border-yt-border rounded-xl px-4 py-3 pr-12 text-yt-text placeholder:text-yt-muted focus:outline-none focus:ring-2 focus:ring-yt-red/40"
          />
          <button
            type="button"
            onClick={onPaste}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-yt-muted hover:text-yt-text rounded-lg hover:bg-yt-hover"
            title="Paste from clipboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
        </div>
        <button type="submit" className="btn-primary whitespace-nowrap">Detect</button>
      </form>
    </div>
  );
}