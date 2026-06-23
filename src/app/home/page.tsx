'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { NewsCard } from '@/components/cards/NewsCard';
import { useApp, Article } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { RefreshCw } from 'lucide-react';

export default function HomePage() {
  const { savedArticleIds, likedArticleIds, toggleSaveArticle, toggleLikeArticle } = useApp();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      // Fetch articles created since the company startup date of June 1, 2026
      const { data, error } = await supabase
        .from('articles')
        .select('id, category, headline, summary, image_url, likes_count, created_at, link')
        .gte('created_at', '2026-06-01T00:00:00Z')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      const allArticles = ((data as unknown as Article[]) || []);

      // 1. Hot news: top 15 latest overall (since June 1, 2026)
      const hotNews = allArticles.slice(0, 15);

      // 2. Trending this month (June 2026)
      // Filters for articles created in the current month, sorted by likes descending
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString();
      const thisMonthArticles = allArticles.filter(art => art.created_at >= startOfMonthStr);
      const trendingThisMonth = [...thisMonthArticles]
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 15);

      // 3. Most liked of all time (since June 1, 2026)
      const mostLikedAllTime = [...allArticles]
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 15);

      // Merge sections and remove duplicates
      const mergedMap = new Map<string, Article>();
      hotNews.forEach(a => mergedMap.set(a.id, a));
      trendingThisMonth.forEach(a => mergedMap.set(a.id, a));
      mostLikedAllTime.forEach(a => mergedMap.set(a.id, a));

      const mergedArticles = Array.from(mergedMap.values());
      
      // Sort final list by created_at descending
      mergedArticles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setArticles(mergedArticles);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        
        {/* Content Heading */}
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Trending Now</h1>
          <p className="text-xs text-muted">
            The latest filter-processed AI and startup intelligence.
          </p>
        </div>

        {/* Article Feed grid */}
        {loadingArticles ? (
          /* Skeleton Loader layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className="p-5 rounded-lg border border-border bg-card flex flex-col justify-between gap-8 h-48 animate-pulse"
              >
                <div className="flex flex-col gap-3">
                  <div className="h-4.5 w-16 bg-border rounded" />
                  <div className="h-6 w-3/4 bg-border rounded" />
                  <div className="h-3 w-full bg-border rounded" />
                  <div className="h-3 w-5/6 bg-border rounded" />
                </div>
                <div className="h-8 w-24 bg-border rounded" />
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => (
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
          <div className="p-12 border border-dashed border-border rounded-lg text-center flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 text-muted animate-spin" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm">No live updates available right now.</span>
              <p className="text-xs text-muted max-w-xs leading-relaxed">
                We are currently syncing with live RSS feeds. Please refresh in a moment.
              </p>
            </div>
            <button
              onClick={fetchArticles}
              className="px-4 py-2 rounded-md border border-border hover:bg-card-hover text-xs font-semibold transition-colors"
            >
              Refresh Feed
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
