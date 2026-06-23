'use client';

import React from 'react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';
import Image from 'next/image';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      {/* Top navbar bar */}
      <div className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6">
        <div className="flex items-center">
          <Image src="/logo.png" alt="Logo" width={92} height={40} className="object-contain object-left dark:invert h-auto" style={{ height: 'auto' }} priority />
        </div>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <OnboardingWizard />
      </div>
    </div>
  );
}
