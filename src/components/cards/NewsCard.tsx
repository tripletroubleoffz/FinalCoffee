'use client';

import React, { useState, useEffect } from 'react';
import { Article } from '@/context/AppContext';
import { Heart, Bookmark, Eye, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export const isPlaceholderImage = (url: string | null | undefined): boolean => {
  if (!url) return true;
  const lower = url.toLowerCase();
  // Only block URLs that are purely generic/blank placeholder images
  return (
    lower.includes('/placeholder') ||
    lower.includes('placeholder.com') ||
    lower.includes('via.placeholder') ||
    lower.includes('dummyimage.com') ||
    lower === '' ||
    // Reject data URIs (inline SVG/base64 that are usually blank)
    lower.startsWith('data:image/svg')
  );
};

function decodeHTMLEntities(text: string): string {
  return (text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=')
    .replace(/&#\d+;/g, (match) => {
      const code = parseInt(match.match(/\d+/)?.[0] || '0', 10);
      return String.fromCharCode(code);
    });
}


interface NewsCardProps {
  article: Article;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
}

export function NewsCard({ article, isLiked, isSaved, onLike, onSave }: NewsCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [modalImageError, setModalImageError] = useState(false);

  const [content, setContent] = useState<string | null>(article.content || null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (detailsOpen && !content) {
      setLoadingDetails(true);
      supabase
        .from('articles')
        .select('content')
        .eq('id', article.id)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setContent(data.content);
          } else if (error) {
            console.error('Failed to fetch details:', error);
          }
          setLoadingDetails(false);
        });
    }
  }, [detailsOpen, article.id, content]);

  useEffect(() => {
    if (detailsOpen) {
      setModalImageError(false);
      setImageError(false);
    }
  }, [detailsOpen]);

  useEffect(() => {
    console.log(`[NewsCard Debug] ID: ${article.id} | Headline: "${article.headline.substring(0, 30)}" | HasImage: ${!!article.image_url} | URL: ${article.image_url || 'null'} | imgErr: ${imageError} | modalErr: ${modalImageError} | isPlaceholder: ${isPlaceholderImage(article.image_url)}`);
  }, [article.id, article.headline, article.image_url, imageError, modalImageError]);


  return (
    <>
      <article className="group flex flex-col justify-between p-5 rounded-lg border border-border bg-card hover:bg-card-hover transition-all duration-200 focus-within:ring-2 focus-within:ring-foreground">
        <div className="flex flex-col gap-3">
          {/* Top metadata badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-background">
              {article.category}
            </span>
            <span className="text-xs text-muted">
              {new Date(article.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Title & description */}
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold group-hover:text-muted transition-colors leading-snug">
              {decodeHTMLEntities(article.headline)}
            </h3>
            {article.image_url && !imageError && !isPlaceholderImage(article.image_url) ? (
              <div className="relative w-full h-40 rounded-md overflow-hidden mt-2 border border-border bg-muted">
                <img
                  src={decodeHTMLEntities(article.image_url)}
                  alt={article.headline}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-8">
                {decodeHTMLEntities(article.summary)}
              </p>
            )}
          </div>
        </div>

        {/* Action controls */}
        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={`flex items-center gap-1.5 text-xs font-medium p-1.5 rounded-md hover:bg-border transition-colors ${
                isLiked ? 'text-foreground font-semibold' : 'text-muted'
              }`}
              aria-label={isLiked ? 'Unlike article' : 'Like article'}
            >
              <Heart className={`w-4.5 h-4.5 transition-colors ${isLiked ? 'fill-red-500 stroke-red-500 text-red-500' : ''}`} />
              <span>{article.likes_count}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              className={`flex items-center gap-1.5 text-xs font-medium p-1.5 rounded-md hover:bg-border transition-colors ${
                isSaved ? 'text-foreground font-semibold' : 'text-muted'
              }`}
              aria-label={isSaved ? 'Remove from saved' : 'Save article'}
            >
              <Bookmark className={`w-4.5 h-4.5 ${isSaved ? 'fill-foreground stroke-foreground' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          <button
            onClick={() => setDetailsOpen(true)}
            className="flex items-center gap-1 text-xs font-semibold border border-foreground/20 bg-background text-foreground hover:bg-foreground hover:text-background px-3 py-1.5 rounded-md transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Read More
          </button>
        </div>
      </article>

      {/* Article Detail modal overlay */}
      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setDetailsOpen(false)}
          />
          
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-card p-6 md:p-8 shadow-2xl z-10 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Header info */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground border border-border px-2.5 py-0.5 rounded-full bg-background">
                {article.category}
              </span>
              <button
                onClick={() => setDetailsOpen(false)}
                className="p-1 rounded-md border border-border hover:bg-card-hover transition-colors focus:outline-none"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Headline */}
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-extrabold leading-tight">
                {decodeHTMLEntities(article.headline)}
              </h2>
              <span className="text-xs text-muted">
                Published {new Date(article.created_at).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {/* Hero Image — shown right below headline */}
            {article.image_url && !modalImageError && !isPlaceholderImage(article.image_url) && (
              <div className="relative w-full h-72 rounded-lg overflow-hidden border border-border bg-muted -mx-0">
                <img
                  src={decodeHTMLEntities(article.image_url)}
                  alt={article.headline}
                  className="object-cover w-full h-full"
                  referrerPolicy="no-referrer"
                  onError={() => setModalImageError(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            )}

            <div className="h-px bg-border w-full" />

            {/* Body Content */}
            <div className="flex flex-col gap-4 text-base leading-relaxed text-muted-foreground">
              {loadingDetails ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  <div className="h-4 w-full bg-border rounded" />
                  <div className="h-4 w-5/6 bg-border rounded" />
                  <div className="h-4 w-4/5 bg-border rounded" />
                  <div className="h-4 w-full bg-border rounded" />
                </div>
              ) : content ? (
                content.split('\n\n').map((para, index) => {
                  const trimmed = para.trim();
                  if (!trimmed) return null;
                  return (
                    <p 
                      key={index} 
                      className={index === 0 ? "font-medium text-foreground" : "whitespace-pre-line"}
                    >
                      {decodeHTMLEntities(trimmed)}
                    </p>
                  );
                })
              ) : (
                <p className="font-medium text-foreground">
                  {decodeHTMLEntities(article.summary)}
                </p>
              )}
            </div>

            <div className="h-px bg-border w-full mt-2" />

            {/* Actions Footer */}
            <div className="flex items-center gap-4">
              <button
                onClick={onLike}
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md border border-border hover:bg-card-hover transition-colors ${
                  isLiked ? 'text-foreground font-medium' : 'text-muted'
                }`}
              >
                <Heart className={`w-4.5 h-4.5 transition-colors ${isLiked ? 'fill-red-500 stroke-red-500 text-red-500' : ''}`} />
                <span>Like ({article.likes_count})</span>
              </button>

              <button
                onClick={onSave}
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md border border-border hover:bg-card-hover transition-colors ${
                  isSaved ? 'text-foreground' : 'text-muted'
                }`}
              >
                <Bookmark className={`w-4.5 h-4.5 ${isSaved ? 'fill-foreground stroke-foreground' : ''}`} />
                <span>{isSaved ? 'Saved Brew' : 'Save Brew'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
