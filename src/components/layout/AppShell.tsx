'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  Home,
  Coffee,
  Volume2,
  Bookmark,
  CreditCard,
  Mail,
  Info,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Shield,
  Terminal,
  ArrowUp
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      const windowScroll = typeof window !== 'undefined' ? window.scrollY : 0;
      const mainScroll = mainRef.current ? mainRef.current.scrollTop : 0;
      
      if (windowScroll > 300 || mainScroll > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Also listen to main element scroll just in case
    const mainEl = mainRef.current;
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
    mainRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Dynamic dashboard accessibility check
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isDeveloper, setIsDeveloper] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const roleParam = searchParams.get('role');
      setIsAdmin(profile?.email === 'tripletrouble.offz@gmail.com' || roleParam === 'admin');
      setIsDeveloper(profile?.email === 'mukilan258@gmail.com' || roleParam === 'developer');
    }
  }, [profile]);

  // Silent self-healing background RSS sync (every 15 minutes)
  React.useEffect(() => {
    const triggerBackgroundIngestion = async () => {
      try {
        const lastFetch = localStorage.getItem('last_rss_fetch_timestamp');
        const now = Date.now();
        // 15 minutes = 900,000 milliseconds
        if (!lastFetch || now - parseInt(lastFetch, 10) > 900000) {
          localStorage.setItem('last_rss_fetch_timestamp', now.toString());
          console.log('[RSS Ingestion] Starting background sync...');
          await fetch('/api/rss/fetch', { method: 'POST' });
          console.log('[RSS Ingestion] Background sync complete.');
        }
      } catch (err) {
        console.error('[RSS Ingestion] Background sync failed:', err);
      }
    };
    if (user) {
      triggerBackgroundIngestion();
    }
  }, [user]);

  // Compute dynamic navigation items
  const sidebarItems: SidebarItem[] = [
    { name: 'Home', href: '/home', icon: Home },
  ];

  if (isAdmin) {
    sidebarItems.push({ name: 'Admin Dashboard', href: '/admin', icon: Shield });
  }
  if (isDeveloper) {
    sidebarItems.push({ name: 'Developer Dashboard', href: '/developer', icon: Terminal });
  }

  sidebarItems.push(
    { name: 'Brewing Room', href: '/brewing-room', icon: Coffee },
    { name: 'Brewing Wave', href: '/brewing-wave', icon: Volume2 },
    { name: 'Saved Brew', href: '/saved-brew', icon: Bookmark },
    { name: 'Subscription', href: '/subscription', icon: CreditCard },
    { name: 'Contact Us', href: '/contact-us', icon: Mail },
    { name: 'About Us', href: '/about-us', icon: Info }
  );

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-20 h-20 animate-spin">
            <Image src="/logo.png" alt="Loading" fill sizes="80px" className="object-contain dark:invert" />
          </div>
          <span className="text-sm font-medium animate-pulse">Brewing FilterCoffee...</span>
        </div>
      </div>
    );
  }

  // Fallback if not logged in - for easy review, we display a mock indicator or redirect to login.
  // We can let them click to go to login.
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md p-6 rounded-lg border border-border bg-card text-center flex flex-col gap-6">
          <div className="relative w-28 h-28 mx-auto">
            <Image src="/logo.png" alt="Logo" fill sizes="112px" className="object-contain dark:invert" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">Authentication Required</h2>
            <p className="text-sm text-muted">
              You must be logged in to access this page.
            </p>
          </div>
          <Link
            href="/login"
            className="w-full py-2.5 rounded-md border border-foreground bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 rounded-md hover:bg-card-hover md:hidden focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo Branding */}
          <Link href="/home" className="flex items-center focus:outline-none">
            <div className="relative w-36 h-10">
              <Image
                src="/logo.png"
                alt="FilterCoffee Logo"
                fill
                sizes="144px"
                className="object-contain object-left dark:invert"
              />
            </div>
          </Link>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* User Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-md border border-border hover:bg-card-hover transition-colors focus:outline-none"
              aria-label="User profile settings"
            >
              <div className="w-7 h-7 rounded-full bg-border overflow-hidden flex items-center justify-center relative">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Avatar"
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-muted" />
                )}
              </div>
              <span className="text-xs font-semibold max-w-[80px] truncate hidden sm:inline-block">
                {profile?.nickname || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted hidden sm:inline-block" />
            </button>

            {userDropdownOpen && (
              <>
                {/* Backdrop Click Guard */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserDropdownOpen(false)}
                />
                
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-card p-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-card-hover transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-card-hover text-red-500 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex flex-1">
        {/* Desktop Left Fixed Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-border bg-card p-4 gap-2 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
          <nav className="flex-1 flex flex-col gap-1.5">
            {sidebarItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors font-medium focus:outline-none ${
                    active
                      ? 'bg-foreground text-background'
                      : 'text-muted hover:bg-card-hover hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Sidebar Footer badge */}
          <div className="p-3 rounded-md bg-background border border-border flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Status</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-border bg-card">
              {profile?.subscription_status === 'PRO' ? 'PRO' : 'FREE'}
            </span>
          </div>
        </aside>

        {/* Mobile Slide-over Overlay / Drawer Menu */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            <aside className="fixed inset-y-0 left-0 w-64 border-r border-border bg-card p-4 flex flex-col gap-4 z-50 animate-in slide-in-from-left duration-200 md:hidden">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <Link
                  href="/home"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center focus:outline-none"
                >
                  <div className="relative w-32 h-9">
                    <Image
                      src="/logo.png"
                      alt="FilterCoffee"
                      fill
                      sizes="128px"
                      className="object-contain object-left dark:invert"
                    />
                  </div>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md hover:bg-card-hover focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-1">
                {sidebarItems.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors font-medium focus:outline-none ${
                        active
                          ? 'bg-foreground text-background'
                          : 'text-muted hover:bg-card-hover hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 rounded-md bg-background border border-border flex items-center justify-between">
                <span className="text-xs text-muted font-medium">Status</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-border bg-card">
                  {profile?.subscription_status === 'PRO' ? 'PRO' : 'FREE'}
                </span>
              </div>
            </aside>
          </>
        )}

        {/* Main Application Stage View */}
        <main ref={mainRef} className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto relative">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
          
          {/* Scroll To Top Button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 p-2.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-background/80 hover:bg-background text-foreground shadow-md hover:shadow-lg transition-all duration-300 z-50 flex items-center justify-center cursor-pointer"
              title="Scroll to top"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
