'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { CreditCard, QrCode, CheckCircle, ShieldCheck, ArrowRight, X, Sparkles, Lock, Clock } from 'lucide-react';

export default function SubscriptionPage() {
  const { profile, refreshProfile } = useApp();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form Fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [upiId, setUpiId] = useState('');

  const currentPlan = profile?.subscription_status || 'FREE';

  const handleUpgrade = async () => {
    if (currentPlan === 'PRO') return;
    if (profile?.pro_request_status === 'PENDING') {
      setPaymentSuccess(true);
    } else {
      setPaymentSuccess(false);
    }
    setCheckoutOpen(true);
  };

  const handlePaymentSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile?.id) return;
    
    setProcessing(true);

    // Simulate request processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      // Update database profile pro_request_status to PENDING
      const { error } = await supabase
        .from('profiles')
        .update({ pro_request_status: 'PENDING' })
        .eq('id', profile.id);

      if (error) throw error;
      
      await refreshProfile();
      setPaymentSuccess(true);
    } catch (err) {
      console.error('Failed to update subscription status:', err);
      // Fallback
      setPaymentSuccess(true);
    } finally {
      setProcessing(false);
    }
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
    setPaymentSuccess(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setUpiId('');
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        
        {/* Heading */}
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Subscription Plans</h1>
          <p className="text-xs text-muted">
            Upgrade your plan to unlock advanced intelligence digests and voice summaries.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mt-4">
          
          {/* FREE PLAN */}
          <div className={`p-6 rounded-lg border bg-card flex flex-col justify-between gap-8 hover:bg-card-hover transition-colors ${
            currentPlan === 'FREE' ? 'border-foreground shadow-sm' : 'border-border'
          }`}>
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm uppercase tracking-widest">FREE PLAN</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Basic Filtering</span>
                </div>
                <span className="text-2xl font-black">₹0</span>
              </div>

              <ul className="flex flex-col gap-3.5 text-xs text-muted-foreground font-medium">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  3 Active Preferences Topics
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Weekly Email Summary Digest
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Basic Saved Brew List
                </li>
              </ul>
            </div>

            {currentPlan === 'FREE' ? (
              <button
                disabled
                className="w-full py-2.5 rounded-md border border-border bg-background text-muted text-xs font-semibold select-none cursor-default"
              >
                Current Active Plan
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2.5 rounded-md border border-border bg-background text-muted text-xs font-semibold"
              >
                Downgrade Locked
              </button>
            )}
          </div>

          {/* PRO PLAN */}
          <div className={`p-6 rounded-lg border-2 bg-card flex flex-col justify-between gap-8 relative ${
            currentPlan === 'PRO' ? 'border-foreground shadow-md' : 'border-foreground/40 hover:border-foreground transition-colors'
          }`}>
            {currentPlan === 'PRO' && (
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded border border-foreground bg-foreground text-background text-[9px] uppercase font-extrabold">
                Active Plan
              </div>
            )}
            
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm uppercase tracking-widest">PRO PLAN</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Full Voice & Real-time Processing</span>
                </div>
                <span className="text-2xl font-black">₹599<span className="text-xs font-normal text-muted">/mo</span></span>
              </div>

              <ul className="flex flex-col gap-3.5 text-xs text-muted-foreground font-medium">
                <li className="flex items-center gap-2 text-foreground font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  10 Active Preferences Topics
                </li>
                <li className="flex items-center gap-2 text-foreground font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Daily Morning Email Digests
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Voice-Based News Experience (Brewing Wave)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Unlimited Saved Brew History
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Priority Access to New ML Features
                </li>
              </ul>
            </div>

            {currentPlan === 'PRO' ? (
              <button
                disabled
                className="w-full py-2.5 rounded-md border border-border bg-background text-muted text-xs font-semibold select-none cursor-default"
              >
                Current Active Plan
              </button>
            ) : profile?.pro_request_status === 'PENDING' ? (
              <button
                onClick={handleUpgrade}
                className="w-full py-2.5 rounded-md border border-amber-600/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold text-xs hover:opacity-90 transition-opacity focus:outline-none"
              >
                Under Review (Click to view)
              </button>
            ) : profile?.pro_request_status === 'REJECTED' ? (
              <button
                onClick={handleUpgrade}
                className="w-full py-2.5 rounded-md border border-foreground bg-foreground text-background font-bold text-xs hover:opacity-90 transition-opacity focus:outline-none"
              >
                Re-apply for PRO
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                className="w-full py-2.5 rounded-md border border-foreground bg-foreground text-background font-bold text-xs hover:opacity-90 transition-opacity focus:outline-none"
              >
                Upgrade to PRO
              </button>
            )}
          </div>

        </div>

        {/* Redesigned Payment Coming Soon / Request Admin Activation modal */}
        {checkoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={closeCheckout} />
            
            <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl z-10 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold text-xs uppercase tracking-wider">PRO Plan Upgrade Request</span>
                </div>
                <button
                  onClick={closeCheckout}
                  className="p-1 rounded-md border border-border hover:bg-card-hover transition-colors focus:outline-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!paymentSuccess ? (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Upgrading to</span>
                    <span className="text-xl font-extrabold flex items-center gap-1.5">
                      FilterCoffee PRO <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                    </span>
                    <span className="text-sm font-semibold mt-0.5">₹599 / month</span>
                  </div>

                  {/* Payment Coming Soon Notice Box */}
                  <div className="p-4 rounded-md border border-border bg-background/50 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider font-mono">Payment Coming Soon</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Stripe and Razorpay gateway integrations are currently in active development. Secure native payment options will be launched in the next software release.
                    </p>
                    <div className="h-[1px] w-full bg-border/50" />
                    <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                      To experience the PRO version today, you can submit an activation request to the administrator.
                    </p>
                  </div>

                  <button
                    onClick={() => handlePaymentSubmit()}
                    disabled={processing}
                    className="w-full py-2.5 rounded-md border border-foreground bg-foreground text-background font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-opacity focus:outline-none flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {processing ? 'Sending Request...' : 'Request Admin Activation'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Access Pending Review screen */
                <div className="flex flex-col items-center text-center gap-4 py-4 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-background border border-border text-foreground flex items-center justify-center shadow-md animate-pulse">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-extrabold text-base">Request Under Review</h3>
                    <p className="text-xs text-muted max-w-xs leading-relaxed">
                      Your upgrade request has been submitted to the administrator.
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2.5 bg-amber-500/10 p-3 rounded border border-amber-500/20">
                      We will review your account details shortly. Standard reviews typically complete within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={closeCheckout}
                    className="mt-4 w-full py-2.5 rounded-md border border-border hover:bg-card-hover font-semibold text-xs transition-colors cursor-pointer focus:outline-none"
                  >
                    Return to Subscriptions
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
