'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import { useApp, Article } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { Volume2, Filter, Music, Play, AlertCircle, RefreshCw } from 'lucide-react';

export default function BrewingWavePage() {
  const { profile } = useApp();
  const [audioArticles, setAudioArticles] = useState<Article[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Article[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');

  const fetchAudioArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, category, headline, duration, audio_url, transcript, created_at, likes_count')
        .gte('created_at', '2026-06-01T00:00:00Z')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const allArticles = (data as Article[] || []);

      // Filter to match the homepage's trending sections
      // 1. Hot news: top 15 latest overall
      const hotNews = allArticles.slice(0, 15);

      // 2. Trending this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString();
      const thisMonthArticles = allArticles.filter(art => art.created_at >= startOfMonthStr);
      const trendingThisMonth = [...thisMonthArticles]
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 15);

      // 3. Most liked of all time
      const mostLikedAllTime = [...allArticles]
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 15);

      // Merge and remove duplicates
      const mergedMap = new Map<string, Article>();
      hotNews.forEach(a => mergedMap.set(a.id, a));
      trendingThisMonth.forEach(a => mergedMap.set(a.id, a));
      mostLikedAllTime.forEach(a => mergedMap.set(a.id, a));

      const trendingArticles = Array.from(mergedMap.values());
      trendingArticles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAudioArticles(trendingArticles);
      if (trendingArticles.length > 0) {
        setSelectedTrack(trendingArticles[0]);
      }
    } catch (err) {
      console.error('Failed to fetch audio feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudioArticles();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = [...audioArticles];

    if (categoryFilter !== 'All') {
      result = result.filter(
        (a) => a.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (timeFilter !== 'All') {
      const now = new Date();
      result = result.filter((a) => {
        const created = new Date(a.created_at);
        const diffMs = now.getTime() - created.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (timeFilter === 'Today') return diffDays <= 1;
        if (timeFilter === 'Week') return diffDays <= 7;
        if (timeFilter === 'Month') return diffDays <= 30;
        return true;
      });
    }

    setFilteredTracks(result);
    
    // Auto-select first matching track if current selected doesn't match filters
    if (result.length > 0) {
      if (!selectedTrack || !result.some((t) => t.id === selectedTrack.id)) {
        setSelectedTrack(result[0]);
      }
    } else {
      setSelectedTrack(null);
    }
  }, [audioArticles, categoryFilter, timeFilter, selectedTrack]);

  // Premium paywall validation: Brewing Wave is a PRO feature.
  const isPro = profile?.subscription_status === 'PRO';

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Heading */}
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Brewing Wave</h1>
          <p className="text-xs text-muted">
            Voice-based news digests. Listen to your daily customized briefs.
          </p>
        </div>

        {/* PRO Access Check */}
        {!isPro ? (
          <div className="p-8 rounded-lg border-2 border-foreground bg-card flex flex-col items-center text-center gap-6 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full border border-border bg-background flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-muted animate-pulse" />
            </div>
            
            <div className="flex flex-col gap-2 max-w-sm">
              <h2 className="text-xl font-bold tracking-tight">Premium Voice Feature</h2>
              <p className="text-xs text-muted leading-relaxed">
                Brewing Wave audio broadcasts are exclusive to FilterCoffee PRO subscribers. Upgrade your account to listen to daily customized voice briefs and scrolling transcripts.
              </p>
            </div>

            <div className="h-px bg-border w-full max-w-sm" />

            <a
              href="/subscription"
              className="px-6 py-2.5 rounded-md border border-foreground bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Upgrade to PRO
            </a>
          </div>
        ) : (
          /* Pro Content Area */
          <div className="flex flex-col gap-6">
            
            {/* Playlist Filters */}
            <div className="p-4 rounded-lg border border-border bg-card flex flex-wrap gap-6 items-center justify-between">
              
              {/* Categories */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted mr-1.5 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Category:
                </span>
                {['All', 'Technology', 'Finance', 'AI'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded border transition-colors ${
                      categoryFilter === cat
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background hover:bg-card-hover text-muted-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Time */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted mr-1.5">Time:</span>
                {['All', 'Today', 'Week', 'Month'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setTimeFilter(time as any)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded border transition-colors ${
                      timeFilter === time
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background hover:bg-card-hover text-muted-foreground'
                    }`}
                  >
                    {time === 'All' ? 'All' : time}
                  </button>
                ))}
              </div>

            </div>

            {/* Stage Split Layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              
              {/* Left Column: Audio details and panels */}
              <div className="flex-1 w-full order-1 lg:order-none">
                <AudioPlayer article={selectedTrack} />
              </div>

              {/* Right Column: Playlist selector */}
              <div className="w-full lg:w-72 border border-border rounded-lg bg-card overflow-hidden order-2 lg:order-none">
                <div className="p-3 border-b border-border bg-background flex items-center gap-2">
                  <Music className="w-4 h-4 text-muted" />
                  <span className="text-xs font-bold uppercase tracking-wider">Audio Playlists</span>
                </div>
                
                {loading ? (
                  <div className="p-4 flex flex-col gap-3">
                    {[1, 2].map((n) => (
                      <div key={n} className="h-10 w-full bg-border rounded animate-pulse" />
                    ))}
                  </div>
                ) : filteredTracks.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border max-h-80 lg:max-h-[380px] overflow-y-auto">
                    {filteredTracks.map((track) => {
                      const active = selectedTrack?.id === track.id;
                      return (
                        <button
                          key={track.id}
                          onClick={() => setSelectedTrack(track)}
                          className={`w-full text-left p-3.5 flex flex-col gap-1 transition-colors hover:bg-card-hover focus:outline-none ${
                            active ? 'bg-background border-l-2 border-foreground' : ''
                          }`}
                        >
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {track.category}
                          </span>
                          <span className={`text-xs font-bold line-clamp-2 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {track.headline}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {track.duration || '0:00'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-muted">
                    No voice feeds match criteria.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}
