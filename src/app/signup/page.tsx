'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SignupPage() {
  const router = useRouter();
  const { setLegalModal } = useApp();
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must accept the Terms of Service.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: name,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Success
      setVerificationSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
    }).catch(() => {
      setError('OAuth redirect failed. Use email registration for the demo.');
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {!verificationSuccess ? (
          <div className="w-full max-w-md border border-border bg-card p-6 md:p-8 rounded-lg shadow-xl flex flex-col gap-6">
            
            {/* Header info */}
            <div className="flex flex-col items-center gap-2 text-center">
              <Link href="/" className="relative w-12 h-12 mb-2 focus:outline-none">
                <Image src="/logo.png" alt="Logo" fill sizes="48px" className="object-contain dark:invert" priority />
              </Link>
              <h1 className="text-xl font-bold tracking-tight">Create Your Account</h1>
              <p className="text-xs text-muted leading-relaxed">
                Filter the noise. Join FilterCoffee today.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-md border border-red-500/20 bg-red-500/5 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Name
                </label>
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                  />
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                  />
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                  />
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                  />
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted" />
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-border accent-foreground cursor-pointer focus:ring-0 mt-0.5 w-4 h-4"
                />
                <span className="text-xs text-muted leading-relaxed">
                  I accept the{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal('terms')}
                    className="font-semibold text-foreground underline focus:outline-none cursor-pointer bg-transparent border-none p-0 inline text-xs"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="font-semibold text-foreground underline focus:outline-none cursor-pointer bg-transparent border-none p-0 inline text-xs"
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full py-2.5 rounded-md border border-foreground bg-foreground text-background font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity focus:outline-none"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-muted tracking-wider">Or</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* Google Signup */}
            <button
              onClick={handleGoogleSignup}
              className="w-full py-2.5 rounded-md border border-border bg-background hover:bg-card-hover text-sm font-semibold transition-colors flex items-center justify-center gap-2 focus:outline-none"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Signup With Google
            </button>

            <p className="text-center text-xs text-muted">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-foreground underline focus:outline-none">
                Login
              </Link>
            </p>
          </div>
        ) : (
          /* Email Verification Success Screen */
          <div className="w-full max-w-md border border-border bg-card p-6 md:p-8 rounded-lg shadow-xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold tracking-tight">Account Created Successfully!</h2>
              <p className="text-xs text-muted leading-relaxed">
                We have registered your credentials in your Supabase backend. Please check your email to verify your address or proceed directly to personalize your feed.
              </p>
            </div>

            <div className="h-px bg-border w-full" />

            <Link
              href="/onboarding"
              className="w-full py-2.5 rounded-md border border-foreground bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity focus:outline-none"
            >
              Continue to Onboarding
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
