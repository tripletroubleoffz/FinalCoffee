'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate reset trigger
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md border border-border bg-card p-6 md:p-8 rounded-lg shadow-xl flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/" className="mb-2 focus:outline-none">
              <Image src="/logo.png" alt="Logo" width={92} height={40} className="object-contain dark:invert h-auto" style={{ height: 'auto' }} priority />
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Reset Password</h1>
            <p className="text-xs text-muted leading-relaxed max-w-xs">
              Enter your email address and we will send you a password recovery link.
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reset-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="reset-email"
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

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-2.5 rounded-md border border-foreground bg-foreground text-background font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity focus:outline-none"
              >
                {loading ? 'Sending link...' : 'Send Recovery Link'}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center text-center gap-4 py-4 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-extrabold text-base">Check Your Inbox</h3>
                <p className="text-xs text-muted max-w-xs">
                  We have simulated sending a password reset link to <span className="font-semibold">{email}</span>.
                </p>
              </div>
            </div>
          )}

          <div className="h-px bg-border w-full" />

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
