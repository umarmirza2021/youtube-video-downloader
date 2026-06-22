export default function ProgressBar({ progress, visible }) {
  if (!visible) return null;

  const indeterminate = progress < 0;

  return (
    <div className="bg-yt-card rounded-2xl border border-yt-border p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Download Progress</span>
        <span className="text-sm text-yt-muted">
          {indeterminate ? 'Streaming to browser...' : progress >= 100 ? 'Started!' : `${Math.round(progress)}%`}
        </span>
      </div>
      <div className="h-2.5 bg-yt-dark rounded-full overflow-hidden">
        {indeterminate ? (
          <div className="h-full w-1/3 bg-yt-red rounded-full animate-pulse" />
        ) : (
          <div
            className="h-full bg-yt-red rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        )}
      </div>
    </div>
  );
}