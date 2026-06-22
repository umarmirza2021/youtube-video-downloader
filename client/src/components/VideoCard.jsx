export default function VideoCard({ video }) {
  return (
    <div className="bg-yt-card rounded-2xl border border-yt-border overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-80 shrink-0">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full aspect-video object-cover"
          />
          {video.duration && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
              {video.duration}
            </span>
          )}
        </div>
        <div className="p-5 flex flex-col justify-center gap-2">
          <h2 className={`text-lg font-medium leading-snug line-clamp-2 ${video.instant && video.title?.includes('Loading') ? 'text-yt-muted animate-pulse' : ''}`}>
            {video.title}
          </h2>
          <p className="text-yt-muted text-sm">{video.channel || (video.instant ? '…' : '')}</p>
          {video.engine && (
            <span className="inline-flex self-start text-[10px] uppercase tracking-wider text-yt-muted bg-yt-dark px-2 py-0.5 rounded">
              via {video.engine}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}