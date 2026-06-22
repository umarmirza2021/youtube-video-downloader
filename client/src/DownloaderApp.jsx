import { useState, useCallback, useEffect, useRef } from 'react';
import UrlInput from './components/UrlInput';
import UniversalInput from './components/UniversalInput';
import VideoCard from './components/VideoCard';
import FormatSelector from './components/FormatSelector';
import ProgressBar from './components/ProgressBar';
import PlaylistView from './components/PlaylistView';
import DownloadHistory from './components/DownloadHistory';
import PlatformSection from './components/PlatformSection';
import Toast from './components/Toast';
import SeoContent from './components/SeoContent';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import { useDownloadHistory } from './hooks/useDownloadHistory';
import { useSeoMeta } from './hooks/useSeoMeta';
import { fetchVideoInfo, enrichVideoInfo, triggerDownload, checkHealth } from './api';
import ApiBanner from './components/ApiBanner';
import { buildInstantVideo, isPlaylistUrl, PRESET_FORMATS } from './utils/youtube';
import { detectPlatform } from './utils/platforms';

export default function DownloaderApp({ page }) {
  useSeoMeta(page);

  const [url, setUrl] = useState('');
  const [video, setVideo] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [activeUrl, setActiveUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [engines, setEngines] = useState(null);
  const [apiOk, setApiOk] = useState(null);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState('');
  const [universalUrl, setUniversalUrl] = useState('');
  const [toast, setToast] = useState('');
  const [highlightedPlatform, setHighlightedPlatform] = useState(page?.platformId || null);
  const [injectRequest, setInjectRequest] = useState(null);
  const enrichRef = useRef(0);
  const platformsRef = useRef(null);
  const heroRef = useRef(null);

  const { history, addEntry, clearHistory } = useDownloadHistory();

  useEffect(() => {
    checkHealth()
      .then((data) => {
        setEngines(data.engines);
        setApiOk(true);
      })
      .catch(() => setApiOk(false));
  }, []);

  useEffect(() => {
    if (!page?.platformId) return;

    if (page.platformId === 'youtube') {
      heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setHighlightedPlatform(page.platformId);
    const timer = setTimeout(() => {
      platformsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    return () => clearTimeout(timer);
  }, [page?.platformId, page?.key]);

  const enrichInBackground = useCallback((videoUrl) => {
    const requestId = ++enrichRef.current;
    setEnriching(true);

    enrichVideoInfo(videoUrl)
      .then((data) => {
        if (enrichRef.current !== requestId) return;
        setVideo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            title: data.title || prev.title,
            channel: data.channel || prev.channel,
            duration: data.duration ?? prev.duration,
            thumbnail: data.thumbnail || prev.thumbnail,
            formats: data.formats || prev.formats,
            instant: false,
          };
        });
        setSelectedFormat((prev) => {
          if (!prev) return PRESET_FORMATS[0];
          const updated = data.formats?.find((f) => f.quality === prev.quality);
          return updated || prev;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (enrichRef.current === requestId) setEnriching(false);
      });
  }, []);

  const showInstantVideo = useCallback((videoUrl) => {
    const instant = buildInstantVideo(videoUrl);
    if (!instant) return false;

    setVideo(instant);
    setActiveUrl(videoUrl);
    setSelectedFormat(PRESET_FORMATS[0]);
    setPlaylist(null);
    setLoading(false);
    return true;
  }, []);

  const handleFetch = useCallback(async (targetUrl) => {
    const fetchUrl = targetUrl || url;
    if (!fetchUrl.trim()) return;

    setError(null);
    setProgress(0);
    setPlaylist(null);

    const trimmed = fetchUrl.trim();
    const isPlaylist = isPlaylistUrl(trimmed);

    if (!isPlaylist && showInstantVideo(trimmed)) {
      enrichInBackground(trimmed);
      fetchVideoInfo(trimmed)
        .then((info) => {
          setVideo((prev) => prev ? {
            ...prev,
            title: info.title || prev.title,
            channel: info.channel || prev.channel,
            thumbnail: info.thumbnail || prev.thumbnail,
          } : info);
        })
        .catch((err) => setError(err.message));
      return;
    }

    setLoading(true);
    setVideo(null);
    setSelectedFormat(null);

    try {
      const info = await fetchVideoInfo(trimmed);

      if (info.isPlaylist) {
        setPlaylist(info);
        setActiveUrl(trimmed);
      } else {
        setVideo(info);
        setActiveUrl(trimmed);
        if (info.formats?.length) setSelectedFormat(info.formats[0]);
        enrichInBackground(trimmed);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url, showInstantVideo, enrichInBackground]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleFetch(url);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        handleFetch(text);
      }
    } catch {
      setError('Could not access clipboard. Please paste manually.');
    }
  };

  const handleSelectPlaylistVideo = (videoUrl) => {
    setError(null);
    setSelectedFormat(null);
    setProgress(0);

    if (showInstantVideo(videoUrl)) {
      enrichInBackground(videoUrl);
      fetchVideoInfo(videoUrl)
        .then((info) => {
          setVideo((prev) => prev ? {
            ...prev,
            title: info.title || prev.title,
            channel: info.channel || prev.channel,
            thumbnail: info.thumbnail || prev.thumbnail,
          } : info);
        })
        .catch((err) => setError(err.message));
      return;
    }

    setLoading(true);
    fetchVideoInfo(videoUrl)
      .then((info) => {
        setVideo(info);
        setActiveUrl(videoUrl);
        if (info.formats?.length) setSelectedFormat(info.formats[0]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleDownload = async (format) => {
    if (!activeUrl || !format) return;

    setDownloading(true);
    setProgress(-1);
    setError(null);

    try {
      await triggerDownload(activeUrl, format, video?.title);

      addEntry({
        url: activeUrl,
        title: video?.title,
        thumbnail: video?.thumbnail,
        format: format.label,
        platform: 'youtube',
      });

      setProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleReuseUrl = (reuseUrl, platform) => {
    if (platform && platform !== 'youtube') {
      setInjectRequest({
        platformId: platform,
        url: reuseUrl,
        username: platform === 'instagram-story' && !reuseUrl.includes('http') ? reuseUrl.replace('@', '') : undefined,
      });
      setHighlightedPlatform(platform);
      platformsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setUrl(reuseUrl);
    handleFetch(reuseUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const processUniversalInput = useCallback((input) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const detected = detectPlatform(trimmed);
    if (!detected) {
      setToast('Unsupported URL. Try a YouTube, Instagram, TikTok, or other supported link.');
      setTimeout(() => setToast(''), 4000);
      return;
    }

    if (detected.section === 'hero') {
      setUrl(trimmed);
      handleFetch(trimmed);
      setToast('YouTube video detected!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setInjectRequest({
        platformId: detected.id,
        url: detected.username ? '' : trimmed,
        username: detected.username,
      });
      setHighlightedPlatform(detected.id);
      setToast(`${detected.label} detected! Scroll down to download.`);
      platformsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => setToast(''), 4000);
  }, [handleFetch]);

  const handleUniversalDetect = (e) => {
    e.preventDefault();
    processUniversalInput(universalUrl);
  };

  const handleUniversalPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUniversalUrl(text);
        processUniversalInput(text);
      }
    } catch {
      setToast('Could not access clipboard.');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handlePlatformDownload = (entry) => {
    addEntry(entry);
  };

  const handleBatchDownload = async () => {
    if (!playlist?.videos?.length || !selectedFormat) {
      setError('Select a format first, then download the first video to confirm quality.');
      return;
    }

    setBatchDownloading(true);
    setError(null);
    const total = playlist.videos.length;

    for (let i = 0; i < total; i++) {
      const item = playlist.videos[i];
      setBatchProgress(`Downloading ${i + 1} of ${total}: ${item.title}`);
      setProgress(0);

      try {
        await triggerDownload(item.url, selectedFormat, item.title);

        addEntry({
          url: item.url,
          title: item.title,
          thumbnail: item.thumbnail,
          format: selectedFormat.label,
          platform: 'youtube',
        });
      } catch (err) {
        setError(`Failed on "${item.title}": ${err.message}`);
        break;
      }
    }

    setBatchDownloading(false);
    setBatchProgress('');
  };

  const showHero = !page?.platformId || page.platformId === 'youtube';

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader page={page} engines={engines} />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 space-y-8 w-full">
        <ApiBanner apiOk={apiOk} />

        <UniversalInput
          value={universalUrl}
          onChange={setUniversalUrl}
          onSubmit={handleUniversalDetect}
          onPaste={handleUniversalPaste}
        />

        {showHero && (
          <section ref={heroRef} id="youtube-hero" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yt-red" />
                YouTube Downloader
              </h2>
              <p className="text-sm text-yt-muted mt-1">Videos, playlists &amp; audio — paste any YouTube link</p>
            </div>

            <UrlInput
              value={url}
              onChange={setUrl}
              onSubmit={handleSubmit}
              loading={loading}
              onPaste={handlePaste}
            />

            {error && (
              <div className="bg-red-950/50 border border-red-800/60 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {playlist && (
              <PlaylistView
                playlist={playlist}
                onSelectVideo={handleSelectPlaylistVideo}
                selectedUrl={activeUrl}
                onBatchDownload={handleBatchDownload}
                batchDownloading={batchDownloading}
              />
            )}

            {batchProgress && (
              <p className="text-sm text-yt-muted text-center">{batchProgress}</p>
            )}

            {video && !video.isPlaylist && (
              <>
                <VideoCard video={video} />
                <FormatSelector
                  formats={video.formats}
                  selected={selectedFormat}
                  onSelect={setSelectedFormat}
                  onDownload={handleDownload}
                  downloading={downloading}
                  enriching={enriching}
                />
                <ProgressBar progress={progress} visible={downloading || progress !== 0} />
              </>
            )}
          </section>
        )}

        {!showHero && error && (
          <div className="bg-red-950/50 border border-red-800/60 text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div ref={platformsRef}>
          <PlatformSection
            highlightedPlatform={highlightedPlatform}
            injectRequest={injectRequest}
            onInjectConsumed={() => setInjectRequest(null)}
            onDownloadComplete={handlePlatformDownload}
          />
        </div>

        <DownloadHistory history={history} onClear={clearHistory} onReuse={handleReuseUrl} />

        <SeoContent sections={page?.sections} />
      </main>

      <Toast message={toast} visible={!!toast} />
      <SiteFooter />
    </div>
  );
}