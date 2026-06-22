export default function PlaylistView({ playlist, onSelectVideo, selectedUrl, onBatchDownload, batchDownloading }) {
  if (!playlist?.videos?.length) return null;

  return (
    <div className="bg-yt-card rounded-2xl border border-yt-border p-5">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-sm font-medium text-yt-muted uppercase tracking-wider">
          Playlist · {playlist.videoCount || playlist.videos.length} videos
        </h3>
        {onBatchDownload && (
          <button
            type="button"
            onClick={onBatchDownload}
            disabled={batchDownloading}
            className="btn-secondary text-xs shrink-0"
          >
            {batchDownloading ? 'Downloading...' : 'Download All'}
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {playlist.videos.map((video, idx) => (
          <button
            key={video.id || idx}
            type="button"
            onClick={() => onSelectVideo(video.url)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
              selectedUrl === video.url
                ? 'bg-yt-red/20 border border-yt-red/40'
                : 'hover:bg-yt-hover border border-transparent'
            }`}
          >
            {video.thumbnail && (
              <img
                src={video.thumbnail}
                alt=""
                className="w-16 h-10 object-cover rounded shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{video.title}</p>
              <p className="text-xs text-yt-muted">{video.duration || video.channel}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}