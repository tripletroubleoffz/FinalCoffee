'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { NewsCard } from '@/components/cards/NewsCard';
import { useApp, Article } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { Bookmark, RefreshCw, Archive } from 'lucide-react';

export default function SavedBrewPage() {
  const { savedArticleIds, likedArticleIds, toggleSaveArticle, toggleLikeArticle } = useApp();
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedArticles = async () => {
    setLoading(true);
    try {
      if (savedArticleIds.size === 0) {
        setSavedArticles([]);
        setLoading(false);
        return;
      }

      // Convert Set of IDs to Array
      const idsArray = Array.from(savedArticleIds);

      // Query Supabase for articles whose ID is in our bookmark list
      const { data, error } = await supabase
        .from('articles')
        .select('id, category, headline, summary, image_url, likes_count, created_at')
        .in('id', idsArray)
        .gte('created_at', '2026-06-01T00:00:00Z')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedArticles(data as Article[] || []);
    } catch (err) {
      console.error('Failed to load bookmarked articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedArticles();
  }, [savedArticleIds]);

  const handleUnsave = async (id: string) => {
    await toggleSaveArticle(id);
    // Instant local removal for snappy user feedback
    setSavedArticles((prev) => prev.filter((art) => art.id !== id));
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        
        {/* Heading */}
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Saved Brew</h1>
          <p className="text-xs text-muted">
            Your collection of saved articles and processed briefs.
          </p>
        </div>

        {/* Saved Grid list */}
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
                </div>
                <div className="h-8 w-24 bg-border rounded" />
              </div>
            ))}
          </div>
        ) : savedArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {savedArticles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                isLiked={likedArticleIds.has(article.id)}
                isSaved={true}
                onLike={async () => {
                  const isLikedNow = await toggleLikeArticle(article.id);
                  setSavedArticles(prev => 
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
                onSave={() => handleUnsave(article.id)}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="p-16 border border-dashed border-border rounded-lg text-center flex flex-col items-center gap-4 mt-2">
            <Archive className="w-8 h-8 text-muted animate-pulse" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm">Your Saved Brew is Empty</span>
              <p className="text-xs text-muted max-w-xs leading-relaxed mx-auto">
                Articles you bookmark on the homepage or discovery feed will appear here for easy reference.
              </p>
            </div>
            <a
              href="/home"
              className="px-4 py-2 rounded-md border border-foreground bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Articles
            </a>
          </div>
        )}

      </div>
    </AppShell>
  );
}
