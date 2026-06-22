'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { LegalModal } from '@/components/ui/LegalModal';

export interface Profile {
  id: string;
  nickname: string | null;
  dob: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  avatar_url: string | null;
  subscription_status: 'FREE' | 'PRO';
  preferred_topics: string[];
}

export interface Article {
  id: string;
  category: string;
  headline: string;
  summary: string;
  content: string;
  image_url: string | null;
  audio_url: string | null;
  duration: string | null;
  transcript: string | null;
  likes_count: number;
  created_at: string;
}

interface AppContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  savedArticleIds: Set<string>;
  likedArticleIds: Set<string>;
  refreshProfile: () => Promise<void>;
  toggleSaveArticle: (articleId: string) => Promise<boolean>;
  toggleLikeArticle: (articleId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  legalModal: 'privacy' | 'terms' | null;
  setLegalModal: (type: 'privacy' | 'terms' | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());
  const [likedArticleIds, setLikedArticleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchProfileAndInteractions = async (userId: string) => {
    try {
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData as Profile);
      }

      // Fetch Saved Articles
      const { data: savedData } = await supabase
        .from('saved_articles')
        .select('article_id')
        .eq('user_id', userId);
      
      if (savedData) {
        setSavedArticleIds(new Set(savedData.map(s => s.article_id)));
      }

      // Fetch Liked Articles
      const { data: likedData } = await supabase
        .from('liked_articles')
        .select('article_id')
        .eq('user_id', userId);
      
      if (likedData) {
        setLikedArticleIds(new Set(likedData.map(l => l.article_id)));
      }
    } catch (err) {
      console.error('Failed to load user state:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndInteractions(user.id);
    }
  };

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfileAndInteractions(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfileAndInteractions(session.user.id).finally(() => setLoading(false));
      } else {
        setUser(null);
        setProfile(null);
        setSavedArticleIds(new Set());
        setLikedArticleIds(new Set());
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleSaveArticle = async (articleId: string): Promise<boolean> => {
    if (!user) return false;
    const isSaved = savedArticleIds.has(articleId);
    
    if (isSaved) {
      // Unsave
      const { error } = await supabase
        .from('saved_articles')
        .delete()
        .eq('user_id', user.id)
        .eq('article_id', articleId);
      
      if (!error) {
        setSavedArticleIds(prev => {
          const next = new Set(prev);
          next.delete(articleId);
          return next;
        });
        return false;
      }
    } else {
      // Save
      const { error } = await supabase
        .from('saved_articles')
        .insert({ user_id: user.id, article_id: articleId });
      
      if (!error) {
        setSavedArticleIds(prev => {
          const next = new Set(prev);
          next.add(articleId);
          return next;
        });
        return true;
      }
    }
    return isSaved;
  };

  const toggleLikeArticle = async (articleId: string): Promise<boolean> => {
    if (!user) return false;
    const isLiked = likedArticleIds.has(articleId);

    if (isLiked) {
      // Unlike in DB (trigger handles articles.likes_count decrement)
      const { error } = await supabase
        .from('liked_articles')
        .delete()
        .eq('user_id', user.id)
        .eq('article_id', articleId);
      
      if (!error) {
        setLikedArticleIds(prev => {
          const next = new Set(prev);
          next.delete(articleId);
          return next;
        });
        return false;
      }
    } else {
      // Like in DB (trigger handles articles.likes_count increment)
      const { error } = await supabase
        .from('liked_articles')
        .insert({ user_id: user.id, article_id: articleId });
      
      if (!error) {
        setLikedArticleIds(prev => {
          const next = new Set(prev);
          next.add(articleId);
          return next;
        });
        return true;
      }
    }
    return isLiked;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        loading,
        savedArticleIds,
        likedArticleIds,
        refreshProfile,
        toggleSaveArticle,
        toggleLikeArticle,
        logout,
        legalModal,
        setLegalModal,
      }}
    >
      {children}
      {legalModal && (
        <LegalModal
          type={legalModal}
          onClose={() => setLegalModal(null)}
        />
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
