import { useState, useEffect, useCallback } from 'react';
import PlatformPreview from './PlatformPreview';
import FormatSelector from './FormatSelector';
import ProgressBar from './ProgressBar';
import { fetchUniversalInfo, triggerUniversalDownload } from '../api';

export default function PlatformDownloader({
  platform,
  config,
  highlighted,
  onDownloadComplete,
  injectRequest,
  onInjectConsumed,
}) {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [data, setData] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [retryAfter, setRetryAfter] = useState(null);

  const handleFetch = useCallback(async (targetUrl, targetUser) => {
    const u = (targetUrl ?? url).trim();
    const un = (targetUser ?? username).trim();
    if (!u && !un) return;

    setLoading(true);
    setError(null);
    setRetryAfter(null);
    setData(null);
    setSelectedFormat(null);

    try {
      const info = await fetchUniversalInfo({
        url: u,
        username: config.supportsUsername ? un : undefined,
        platform: platform.id,
      });
      setData(info);
      if (info.formats?.length) setSelectedFormat(info.formats[0]);
    } catch (err) {
      setError(err.message);
      setRetryAfter(err.retryAfter || null);
    } finally {
      setLoading(false);
    }
  }, [url, username, config.supportsUsername, platform.id]);

  useEffect(() => {
    if (!injectRequest || injectRequest.platformId !== platform.id) return;
    setUrl(injectRequest.url || '');
    if (injectRequest.username) setUsername(injectRequest.username);
    onInjectConsumed?.();
    handleFetch(injectRequest.url || '', injectRequest.username || '');
  }, [injectRequest, platform.id, handleFetch, onInjectConsumed]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleFetch();
  };

  const handleDownload = (format) => {
    setDownloading(true);
    setProgress(-1);
    setError(null);

    try {
      triggerUniversalDownload({
        url: url.trim(),
        platform: platform.id,
        format,
        title: data?.title,
        username: username.trim() || data?.channel,
        storyId: format.storyId,
      });

      onDownloadComplete?.({
        url: url.trim() || `https://instagram.com/${username}`,
        title: data?.title,
        thumbnail: data?.thumbnail,
        format: format.label,
        platform: platform.id,
      });

      setTimeout(() => {
        setProgress(100);
        setDownloading(false);
      }, 1500);
    } catch (err) {
      setError(err.message);
      setDownloading(false);
    }
  };

  return (
    <div
      id={`platform-${platform.id}`}
      className={`rounded-2xl border p-5 transition-all ${config.border} ${highlighted ? 'ring-2 ring-white/20' : ''} bg-yt-card`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.accent} flex items-center justify-center shrink-0`}>
          <span className="text-white font-bold text-sm">{platform.name[0]}</span>
        </div>
        <div>
          <h3 className="font-semibold">{platform.name}</h3>
          <p className="text-[10px] text-yt-muted">{config.hint}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={config.placeholder}
          className="flex-1 bg-yt-dark border border-yt-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/10"
          disabled={loading}
        />
        {config.supportsUsername && (
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            className="sm:w-36 bg-yt-dark border border-yt-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            disabled={loading}
          />
        )}
        <button type="submit" disabled={loading} className="btn-primary text-sm whitespace-nowrap">
          {loading ? 'Fetching…' : 'Get Media'}
        </button>
      </form>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-950/50 border border-red-900/50 text-red-300 text-xs rounded-lg">
          {error}
          {retryAfter ? ` Retry in ${retryAfter}s.` : ''}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <PlatformPreview data={data} platform={platform.id} />
          {data.formats?.length > 0 && (
            <FormatSelector
              formats={data.formats}
              selected={selectedFormat}
              onSelect={setSelectedFormat}
              onDownload={handleDownload}
              downloading={downloading}
            />
          )}
          {data.stories?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.stories.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => handleDownload({
                    id: 'story',
                    label: 'Story',
                    ext: story.isVideo ? 'mp4' : 'jpg',
                    type: 'video',
                    storyId: story.id,
                  })}
                  className="btn-secondary text-xs"
                >
                  Download story
                </button>
              ))}
            </div>
          )}
          <ProgressBar progress={progress} visible={downloading || progress !== 0} />
        </div>
      )}
    </div>
  );
}