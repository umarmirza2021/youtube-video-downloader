import { useState, useEffect } from 'react';
import { PLATFORM_TABS } from '../utils/platforms';
import PlatformDownloader from './PlatformDownloader';

export default function PlatformSection({ highlightedPlatform, injectRequest, onInjectConsumed, onDownloadComplete }) {
  const [activeTab, setActiveTab] = useState(PLATFORM_TABS[0].id);

  useEffect(() => {
    if (highlightedPlatform && highlightedPlatform !== 'hero') {
      const tab = PLATFORM_TABS.find((t) => t.id === highlightedPlatform);
      if (tab) setActiveTab(highlightedPlatform);
    }
  }, [highlightedPlatform]);

  const active = PLATFORM_TABS.find((t) => t.id === activeTab) || PLATFORM_TABS[0];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">More Platforms</h2>
        <p className="text-sm text-yt-muted mt-1">Download from Instagram, TikTok, Pinterest, and more</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PLATFORM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.accent} text-white border-transparent`
                : 'bg-yt-card text-yt-muted border-yt-border hover:bg-yt-hover'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <PlatformDownloader
        platform={{ id: active.id, name: active.name }}
        config={active}
        highlighted={highlightedPlatform === active.id}
        injectRequest={injectRequest?.platformId === active.id ? injectRequest : null}
        onInjectConsumed={onInjectConsumed}
        onDownloadComplete={onDownloadComplete}
      />
    </section>
  );
}