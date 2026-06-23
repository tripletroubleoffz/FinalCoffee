'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ArrowRight } from 'lucide-react';

export function Header() {
  const { user } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo Branding */}
          <Link href="/" className="flex items-center focus:outline-none">
            <Image
              src="/logo.png"
              alt="FilterCoffee Logo"
              width={92}
              height={40}
              className="object-contain object-left dark:invert h-auto"
              style={{ height: 'auto' }}
              priority
            />
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-muted hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/about-us" className="text-sm text-muted hover:text-foreground transition-colors">
              About Us
            </Link>
            <Link href="/#pricing" className="text-sm text-muted hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {user ? (
              <Link
                href="/home"
                className="flex items-center gap-1 text-sm font-semibold border border-foreground bg-foreground text-background px-4 py-2 rounded-md hover:opacity-90 transition-opacity focus:outline-none"
              >
                Go to App <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-muted hover:text-foreground transition-colors focus:outline-none"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold border border-foreground bg-foreground text-background px-4 py-2 rounded-md hover:opacity-90 transition-opacity focus:outline-none"
                >
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
