'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { NewsCard } from '@/components/cards/NewsCard';
import { useApp, Article } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { Search, RefreshCw, X, Calendar, Tag, SlidersHorizontal } from 'lucide-react';

export default function BrewingRoomPage() {
  const { savedArticleIds, likedArticleIds, toggleSaveArticle, toggleLikeArticle } = useApp();

  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'All' | 'Today' | 'This Week' | 'This Month'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, category, headline, summary, content, image_url, likes_count, created_at, link')
        .gte('created_at', '2026-06-01T00:00:00Z')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enforce the 500 character content requirement
      const validArticles = ((data as unknown as Article[]) || []).filter(
        (a) => a.content && a.content.trim().length >= 500
      );
      setArticles(validArticles);
    } catch (err) {
      console.error('Failed to load articles in discovery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = [...articles];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.headline.toLowerCase().includes(query) ||
          a.summary.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
      );
    }

    // 2. Category Filter
    if (categoryFilter !== 'All') {
      result = result.filter(
        (a) => a.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // 3. Time Filter
    if (timeFilter !== 'All') {
      const now = new Date();
      result = result.filter((a) => {
        const created = new Date(a.created_at);
        const diffMs = now.getTime() - created.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (timeFilter === 'Today') {
          return diffDays <= 1;
        } else if (timeFilter === 'This Week') {
          return diffDays <= 7;
        } else if (timeFilter === 'This Month') {
          return diffDays <= 30;
        }
        return true;
      });
    }

    setFilteredArticles(result);
  }, [articles, searchQuery, categoryFilter, timeFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setTimeFilter('All');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'All' || timeFilter !== 'All';

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        
        {/* Heading */}
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Personalized News Discovery</h1>
          <p className="text-xs text-muted">
            Search, filter, and brew insights matching your preferences.
          </p>
        </div>

        {/* Search & Filters — always visible */}
        <div className="flex flex-col gap-4">

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search headlines, summaries, categories..."
              className="w-full h-10 pl-9 pr-4 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 p-0.5 rounded-full hover:bg-border text-muted"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Panel — always visible */}
          <div className="p-5 rounded-lg border border-border bg-card grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Time Filters */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Filter by Time
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['All', 'Today', 'This Week', 'This Month'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeFilter(t)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors ${
                      timeFilter === t
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background hover:bg-card-hover text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> Filter by Category
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Technology', 'AI', 'Finance', 'Startups', 'Business'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors ${
                      categoryFilter === c
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-background hover:bg-card-hover text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Filter Status Bar */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between p-3 rounded-md border border-border bg-card/50 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-muted">
                <span>Active Filters:</span>
                {categoryFilter !== 'All' && (
                  <span className="px-2 py-0.5 rounded border border-border bg-background text-foreground font-medium">
                    Category: {categoryFilter}
                  </span>
                )}
                {timeFilter !== 'All' && (
                  <span className="px-2 py-0.5 rounded border border-border bg-background text-foreground font-medium">
                    Time: {timeFilter}
                  </span>
                )}
                {searchQuery && (
                  <span className="px-2 py-0.5 rounded border border-border bg-background text-foreground font-medium truncate max-w-[150px]">
                    Search: &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
              </div>
              
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-foreground hover:underline focus:outline-none"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Results grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {[1, 2].map((num) => (
              <div
                key={num}
                className="p-5 rounded-lg border border-border bg-card flex flex-col justify-between gap-8 h-48 animate-pulse"
              >
                <div className="flex flex-col gap-3">
                  <div className="h-4.5 w-16 bg-border rounded" />
                  <div className="h-6 w-3/4 bg-border rounded" />
                  <div className="h-3 w-full bg-border rounded" />
                </div>
                <div className="h-8 w-24 bg-border rounded" />
              </div>
            ))}
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {filteredArticles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                isLiked={likedArticleIds.has(article.id)}
                isSaved={savedArticleIds.has(article.id)}
                onLike={async () => {
                  const isLikedNow = await toggleLikeArticle(article.id);
                  setArticles(prev => 
                    prev.map(art => {
                      if (art.id === article.id) {
                        return {
                          ...art,
                          likes_count: isLikedNow ? art.likes_count + 1 : Math.max(0, art.likes_count - 1)
                        };
                      }
                      return art;
                    })
                  );
                }}
                onSave={() => toggleSaveArticle(article.id)}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="p-16 border border-dashed border-border rounded-lg text-center flex flex-col items-center gap-4 mt-2">
            {articles.length === 0 ? (
              <>
                <RefreshCw className="w-8 h-8 text-muted animate-spin" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sm">No live updates available right now.</span>
                  <p className="text-xs text-muted max-w-xs leading-relaxed mx-auto">
                    We are currently syncing with live RSS feeds. Please check back in a moment.
                  </p>
                </div>
                <button
                  onClick={fetchArticles}
                  className="px-4 py-2 rounded-md border border-border hover:bg-card-hover text-xs font-semibold transition-colors"
                >
                  Refresh Feed
                </button>
              </>
            ) : (
              <>
                <SlidersHorizontal className="w-8 h-8 text-muted" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sm">No Brew Matches Your Filters</span>
                  <p className="text-xs text-muted max-w-xs leading-relaxed mx-auto">
                    We couldn&apos;t find any articles matching your search query or criteria. Try resetting your active filters.
                  </p>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-md border border-border bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Reset Filters
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </AppShell>
  );
}
