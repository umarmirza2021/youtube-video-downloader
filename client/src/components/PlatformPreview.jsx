export default function PlatformPreview({ data, platform }) {
  if (!data) return null;

  return (
    <div className="bg-yt-dark/50 rounded-xl p-4 border border-yt-border/50">
      <div className="flex gap-4">
        {data.thumbnail && (
          <img src={data.thumbnail} alt="" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg shrink-0" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="font-medium text-sm sm:text-base line-clamp-2">{data.title}</h4>
          {data.channel && <p className="text-yt-muted text-xs sm:text-sm">@{data.channel}</p>}
          {data.caption && <p className="text-yt-muted text-xs line-clamp-2">{data.caption}</p>}
          {data.description && !data.caption && <p className="text-yt-muted text-xs line-clamp-2">{data.description}</p>}
          {data.tweetText && <p className="text-yt-muted text-xs line-clamp-3">{data.tweetText}</p>}
          {data.likes != null && <p className="text-yt-muted text-xs">{Number(data.likes).toLocaleString()} likes</p>}
          {data.duration && <p className="text-yt-muted text-xs">Duration: {data.duration}</p>}
          {data.mediaType && <p className="text-yt-muted text-xs capitalize">{data.mediaType} pin</p>}
          {data.watermarkNote && platform === 'tiktok' && (
            <p className="text-amber-400/80 text-[10px] mt-1">{data.watermarkNote}</p>
          )}
        </div>
      </div>

      {data.stories?.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {data.stories.map((story) => (
            <div key={story.id} className="relative aspect-[9/16] rounded-lg overflow-hidden bg-yt-hover">
              <img src={story.thumbnail} alt="" className="w-full h-full object-cover" />
              {story.isVideo && (
                <span className="absolute bottom-1 right-1 bg-black/70 text-[10px] px-1 rounded">VIDEO</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}