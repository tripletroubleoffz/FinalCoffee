'use client';

import Link from 'next/link';
import { useApp } from '@/context/AppContext';

export function Footer() {
  const { setLegalModal } = useApp();

  return (
    <footer className="w-full border-t border-border bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Brand details */}
          <div className="flex flex-col gap-3">
            <span className="font-bold text-lg">FilterCoffee</span>
            <p className="text-sm text-muted leading-relaxed">
              Transforming information overload into actionable intelligence. Filter the noise, brew the insights, save what matters.
            </p>
          </div>

          {/* Column 2: Company Details */}
          <div className="flex flex-col gap-3">
            <span className="font-semibold text-sm uppercase tracking-wider">Company</span>
            <div className="flex flex-col gap-2 text-sm text-muted">
              <span>Location: Bengaluru, India</span>
              <span>Contact: hello@filtercoffee.ai</span>
              <Link href="/about-us" className="hover:text-foreground transition-colors">
                About Us
              </Link>
            </div>
          </div>

          {/* Column 3: Legal & Policy */}
          <div className="flex flex-col gap-3">
            <span className="font-semibold text-sm uppercase tracking-wider">Legal</span>
            <div className="flex flex-col gap-2 text-sm text-muted">
              <button
                onClick={() => setLegalModal('privacy')}
                className="hover:text-foreground transition-colors text-left focus:outline-none cursor-pointer bg-transparent border-none p-0 text-sm"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setLegalModal('terms')}
                className="hover:text-foreground transition-colors text-left focus:outline-none cursor-pointer bg-transparent border-none p-0 text-sm"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-xs text-muted">
            &copy; {new Date().getFullYear()} FilterCoffee. All rights reserved.
          </span>
          <span className="text-xs text-muted">
            Developed by TRIPLETROUBLEOFFICIALS
          </span>
        </div>
      </div>
    </footer>
  );
}
