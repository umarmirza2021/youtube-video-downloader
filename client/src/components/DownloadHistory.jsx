import { getPlatformTab } from '../utils/platforms';

const PLATFORM_LABELS = {
  youtube: 'YouTube',
  'youtube-shorts': 'Shorts',
  'instagram-reel': 'IG Reel',
  'instagram-story': 'IG Story',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  twitter: 'X',
  facebook: 'Facebook',
};

export default function DownloadHistory({ history, onClear, onReuse }) {
  if (!history.length) return null;

  return (
    <div className="bg-yt-card rounded-2xl border border-yt-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-yt-muted uppercase tracking-wider">
          Download History
        </h3>
        <button type="button" onClick={onClear} className="text-xs text-yt-muted hover:text-yt-text transition-colors">
          Clear
        </button>
      </div>

      <div className="space-y-2">
        {history.map((item) => {
          const tab = getPlatformTab(item.platform);
          const label = PLATFORM_LABELS[item.platform] || item.platform || 'YouTube';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onReuse(item.url, item.platform)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-yt-hover transition-colors text-left"
            >
              {item.thumbnail && (
                <img src={item.thumbnail} alt="" className="w-12 h-8 object-cover rounded shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{item.title}</p>
                <p className="text-xs text-yt-muted">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] mr-1 ${tab ? `bg-gradient-to-r ${tab.accent} text-white` : 'bg-yt-hover'}`}>
                    {label}
                  </span>
                  {item.format} · {new Date(item.timestamp).toLocaleDateString()}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}