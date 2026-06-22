export default function EngineStatus({ engines }) {
  if (!engines) return null;

  return (
    <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
      <span className={`px-2 py-1 rounded ${engines.ytdlp ? 'bg-green-900/40 text-green-400' : 'bg-yt-card text-yt-muted'}`}>
        yt-dlp {engines.ytdlp ? 'ready' : 'unavailable'}
      </span>
      <span className={`px-2 py-1 rounded ${engines.rapidapi ? 'bg-green-900/40 text-green-400' : 'bg-yt-card text-yt-muted'}`}>
        RapidAPI {engines.rapidapi ? 'ready' : 'off'}
      </span>
      <span className={`px-2 py-1 rounded ${engines.instaloader ? 'bg-green-900/40 text-green-400' : 'bg-yt-card text-yt-muted'}`}>
        Instagram {engines.instaloader ? 'ready' : 'off'}
      </span>
    </div>
  );
}