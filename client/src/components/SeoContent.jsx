const SECTIONS = {
  overview: (
    <div>
      <h2 className="text-lg font-semibold text-yt-text mb-2">Free Online Video Downloader</h2>
      <p>
        Download videos and audio from YouTube, Instagram Reels, TikTok, Pinterest, Twitter/X,
        and Facebook — all in one place. Paste any link, pick your quality, and save to your device.
        No account required. Open source and free to self-host.
      </p>
    </div>
  ),
  youtube: (
    <div>
      <h3 className="font-medium text-yt-text mb-1">YouTube Video &amp; MP3 Downloader</h3>
      <p>
        Save YouTube videos in 1080p, 720p, 480p, or 360p MP4. Extract MP3 audio from any video.
        Supports playlists and YouTube Shorts with vertical or horizontal export.
      </p>
    </div>
  ),
  instagram: (
    <div>
      <h3 className="font-medium text-yt-text mb-1">Instagram Reel &amp; Story Downloader</h3>
      <p>
        Download Instagram Reels in original quality. Fetch active stories by username or story URL.
        Save individual stories or download all as a ZIP archive.
      </p>
    </div>
  ),
  tiktok: (
    <div>
      <h3 className="font-medium text-yt-text mb-1">TikTok Downloader — With &amp; Without Watermark</h3>
      <p>
        Save TikTok videos in HD with or without the TikTok watermark. View caption, creator name,
        and like count before downloading.
      </p>
    </div>
  ),
  other: (
    <div>
      <h3 className="font-medium text-yt-text mb-1">Pinterest, Twitter/X &amp; Facebook</h3>
      <p>
        Download Pinterest pins as full-resolution images or MP4 videos. Save Twitter/X tweet videos
        in multiple qualities. Download public Facebook videos and reels in HD or SD.
      </p>
    </div>
  ),
};

export default function SeoContent({ sections = ['overview', 'youtube', 'instagram', 'tiktok', 'other'] }) {
  return (
    <section className="bg-yt-card rounded-2xl border border-yt-border p-6 space-y-6 text-sm text-yt-muted leading-relaxed">
      {sections.map((key) => (
        <div key={key}>{SECTIONS[key]}</div>
      ))}
      <p className="text-xs border-t border-yt-border pt-4">
        For personal, non-commercial use only. Respect copyright and each platform&apos;s Terms of Service.
      </p>
    </section>
  );
}