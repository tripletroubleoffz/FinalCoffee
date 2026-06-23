'use client';

import React from 'react';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/context/AppContext';
import { Compass, Target, Users } from 'lucide-react';

const teamMembers = [
  { name: 'Mukilan C', role: 'Co-Founder & Lead AI Architect', bio: 'Directs the core machine learning models, search indices, and recommendation logic.' },
  { name: 'DeepakRaj JS', role: 'Co-Founder & Lead Systems Engineer', bio: 'Architects real-time RSS ingestion pipelines, database schemas, and background triggers.' },
  { name: 'Aruthra SM', role: 'Co-Founder & Lead SaaS Designer', bio: 'Engineers clean, minimal, Apple-inspired monochromatic frontend user experiences.' },
];

function AboutUsContent() {
  return (
    <div className="flex flex-col gap-12 py-4">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 border-b border-border pb-10">
        <div className="flex-1 flex flex-col gap-4">
          <span className="text-xs uppercase tracking-widest text-muted font-bold">Our Story</span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">FILTERCOFFEE</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            FilterCoffee was founded with a single mission: to transform information overload into actionable intelligence. Every single day, thousands of papers, releases, funding rounds, and announcements flood the internet. It is physically impossible to keep up.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We operate like a premium coffee roastery: we collect the raw data beans, roast them through our custom classification algorithms, filter out the debris and sponsor noise, and brew a tailored cup of insights straight to your inbox and client application.
          </p>
        </div>

        {/* Company Logo illustration */}
        <div className="w-full md:w-80 h-64 rounded-lg border border-border bg-card flex items-center justify-center p-6 relative overflow-hidden">
          <Image
            src="/logo.png"
            alt="FilterCoffee Logo"
            width={200}
            height={87}
            className="object-contain dark:invert h-auto"
            style={{ height: 'auto' }}
            priority
          />
        </div>
      </div>

      {/* Vision & Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-border pb-10">
        {/* Vision */}
        <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-4">
          <div className="w-8 h-8 border border-border bg-background rounded flex items-center justify-center">
            <Compass className="w-4 h-4 text-muted" />
          </div>
          <h2 className="text-lg font-bold">Our Vision</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We envision a software ecosystem where developers, executives, and builders regain hours of focus from feed-scrolling. By offering minimal monochromatic interfaces, we prioritize cognitive clarity, creating high-fidelity SaaS tools that respect user attention and eye strain.
          </p>
        </div>

        {/* Mission */}
        <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-4">
          <div className="w-8 h-8 border border-border bg-background rounded flex items-center justify-center">
            <Target className="w-4 h-4 text-muted" />
          </div>
          <h2 className="text-lg font-bold">Our Mission</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            To parse, filter, and summarize global technical and venture content on behalf of professionals. We deliver verified data models, compute insights, and career telemetry in standard text summaries and professional voice broadcasts directly to premium subscribers.
          </p>
        </div>
      </div>

      {/* Team Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" /> The Team
          </h2>
          <p className="text-xs text-muted">Developed by TRIPLETROUBLEOFFICIALS</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="p-5 border border-border bg-card rounded-lg flex flex-col gap-2.5">
              <div className="flex flex-col">
                <span className="font-bold text-sm">{member.name}</span>
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5">{member.role}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AboutUsPage() {
  const { user } = useApp();

  // If logged in, wrap with AppShell. If logged out, render standard public structure.
  if (user) {
    return (
      <AppShell>
        <AboutUsContent />
      </AppShell>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <AboutUsContent />
      </main>
      <Footer />
    </div>
  );
}
