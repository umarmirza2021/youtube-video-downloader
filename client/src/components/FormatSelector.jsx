export default function FormatSelector({ formats, selected, onSelect, onDownload, downloading, enriching }) {
  if (!formats?.length) return null;

  return (
    <div className="bg-yt-card rounded-2xl border border-yt-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-yt-muted uppercase tracking-wider">
          Select Format
        </h3>
        {enriching && (
          <span className="text-[10px] text-yt-muted animate-pulse">Loading file sizes…</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {formats.map((fmt) => (
          <button
            key={fmt.quality}
            type="button"
            onClick={() => onSelect(fmt)}
            disabled={downloading}
            className={`format-btn ${selected?.quality === fmt.quality ? 'format-btn-active' : 'format-btn-inactive'}`}
          >
            {fmt.label}
            {fmt.filesizeFormatted && (
              <span className="block text-[10px] opacity-70 mt-0.5">{fmt.filesizeFormatted}</span>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-yt-border">
          <div className="text-sm text-yt-muted">
            <span className="text-yt-text font-medium">{selected.label}</span>
            {selected.filesizeFormatted && (
              <span> · Est. {selected.filesizeFormatted}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDownload(selected)}
            disabled={downloading}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}