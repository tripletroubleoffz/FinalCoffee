'use client';

import React from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-lg border border-border bg-card p-6 md:p-8 shadow-2xl z-10 flex flex-col gap-6 max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-extrabold tracking-tight">
              {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
            </h2>
            <span className="text-xs text-muted">Last updated: June 21, 2026</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md border border-border hover:bg-card-hover transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 text-sm text-muted-foreground leading-relaxed">
          {isPrivacy ? (
            <>
              <p>
                At FilterCoffee, we take your privacy seriously. This document outlines the types of user data we collect, store, and utilize inside our intelligence classification platform.
              </p>
              
              <h3 className="text-base font-bold text-foreground mt-2">1. Data Collection</h3>
              <p>
                We collect basic account metadata like your name, email, country, gender, and selected news topic preferences to roast and personalize your news brews.
              </p>
              
              <h3 className="text-base font-bold text-foreground mt-2">2. Cookies and Storage</h3>
              <p>
                We use local browser storage and cookie structures to remember your preferred layout theme (dark/light) and active auth credentials.
              </p>
              
              <h3 className="text-base font-bold text-foreground mt-2">3. Database Security</h3>
              <p>
                All account metadata is secured through Supabase database integrations, using strict Row Level Security (RLS) policies. Only you have the ability to read or update your private profile settings.
              </p>
            </>
          ) : (
            <>
              <p>
                Welcome to FilterCoffee. By using our application, websites, or voice broadcasts, you agree to comply with the following Terms of Service.
              </p>
              
              <h3 className="text-base font-bold text-foreground mt-2">1. License and Usage</h3>
              <p>
                We grant users a limited, non-transferable license to access AI-curated summaries (Brews) for personal research purposes. You may not scrape, replicate, or resell this content without explicit written consent.
              </p>
              
              <h3 className="text-base font-bold text-foreground mt-2">2. Account Responsibility</h3>
              <p>
                You are responsible for keeping your login credentials secure. Any database actions performed under your logged-in profile are assumed to be authorized by you.
              </p>
              
              <h3 className="text-base font-bold text-foreground mt-2">3. Premium Subscriptions</h3>
              <p>
                Our PRO plan is billed on a monthly recurring basis of ₹599. Subscriptions can be canceled at any time in your profile portal, locking further voice broadcast functions.
              </p>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-md border border-foreground bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity focus:outline-none"
          >
            Acknowledge
          </button>
        </div>

      </div>
    </div>
  );
}
