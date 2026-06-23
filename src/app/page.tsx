'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, Layers, ShieldCheck, Compass, ArrowUpRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

const insights = [
  {
    icon: Compass,
    title: 'Intelligence Across Every Horizon',
    description: 'We process publications across global tech hubs, research institutes, startup markets, and developer communities.',
  },
  {
    icon: Layers,
    title: 'Intelligence That Matters',
    description: 'Our filters analyze relevance, citations, and product benchmarks, extracting actionable insights from the raw bean news.',
  },
  {
    icon: ShieldCheck,
    title: 'From Noise To Clarity',
    description: 'Replace hours of reading with targeted 2-minute text summaries and professional voice newsletters synced to you.',
  },
];

const liveUpdates = [
  {
    category: 'AI',
    badgeClass: 'text-amber-600 border-amber-600/30 dark:text-amber-400 dark:border-amber-400/20',
    headline: 'OpenAI Launches GPT-5 Preview with Native Multi-Agent Orchestration',
    summary: 'Features native agent coordination allowing developers to define complex hierarchies directly in API calls. Impact: Shifts UI frameworks toward agentic state systems.',
  },
  {
    category: 'FINANCE',
    badgeClass: 'text-emerald-600 border-emerald-600/30 dark:text-emerald-400 dark:border-emerald-400/20',
    headline: 'Physical Intelligence Closes $400M Seed Round for Robot Control Software',
    summary: 'Bezos Expeditions and OpenAI back universal control models for physical movement. Valuation: $2.4B post-money.',
  },
  {
    category: 'RESEARCH',
    badgeClass: 'text-slate-600 border-slate-600/30 dark:text-slate-400 dark:border-slate-400/20',
    headline: 'DeepMind Unveils AlphaFold 3: Modeling Protein-DNA Interactions',
    summary: "Predicts interactions of life's molecules (DNA, RNA, chemical compounds) in silico. Research: Speeds drug validation times by 80%.",
  },
  {
    category: 'MARKET',
    badgeClass: 'text-purple-600 border-purple-600/30 dark:text-purple-400 dark:border-purple-400/20',
    headline: 'Anthropic Launches Artifacts API for Collaborative Canvas Sharing',
    summary: 'Allows software providers to embed shared canvas visual frames directly into enterprise messaging channels, boosting team editing productivity.',
  },
  {
    category: 'CAREERS',
    badgeClass: 'text-rose-600 border-rose-600/30 dark:text-rose-400 dark:border-rose-400/20',
    headline: 'Rust and GPU Optimization Skills Surge in Global AI Talent Market',
    summary: 'Data indicates a 140% year-over-year increase in job postings seeking low-level system design experts, overtaking high-level API integrations.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user } = useApp();
  const [updates, setUpdates] = useState(liveUpdates);

  const handleEnterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      router.push('/home');
    } else {
      router.push('/login');
    }
  };

  useEffect(() => {
    const loadLiveUpdates = async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString();

      const getTrending = async (dbCategories: string[]) => {
        try {
          // 1. Try to get most liked / newest article from last 7 days
          let { data, error } = await supabase
            .from('articles')
            .select('category, headline, summary')
            .in('category', dbCategories)
            .gte('created_at', oneWeekAgoStr)
            .order('likes_count', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) throw error;

          if (data && data.length > 0) {
            return data[0];
          }

          // 2. Fallback to latest overall if none in the last 7 days
          const { data: fallback, error: fallbackError } = await supabase
            .from('articles')
            .select('category, headline, summary')
            .in('category', dbCategories)
            .order('likes_count', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1);

          if (fallbackError) throw fallbackError;

          if (fallback && fallback.length > 0) {
            return fallback[0];
          }
        } catch (err) {
          console.error('Error fetching trending for', dbCategories, err);
        }
        return null;
      };

      const domains = [
        { key: 'AI', dbCats: ['AI', 'Model Wars'] },
        { key: 'FINANCE', dbCats: ['Finance', 'Startup Funding'] },
        { key: 'RESEARCH', dbCats: ['Research', 'Technology', 'Engineering'] },
        { key: 'MARKET', dbCats: ['SaaS', 'AI Marketplace', 'Startups'] },
        { key: 'CAREERS', dbCats: ['Careers', 'Career Radar'] }
      ];

      const newUpdates = await Promise.all(
        domains.map(async (dom, idx) => {
          const trendingArticle = await getTrending(dom.dbCats);
          if (trendingArticle) {
            return {
              category: dom.key,
              badgeClass: liveUpdates[idx].badgeClass,
              headline: trendingArticle.headline,
              summary: trendingArticle.summary
            };
          }
          // Return default fallback if nothing in DB
          return liveUpdates[idx];
        })
      );

      setUpdates(newUpdates);
    };

    loadLiveUpdates();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12 border-b border-border">
        {/* Left hero info */}
        <div className="flex-1 flex flex-col gap-6 items-start">

          <div className="flex flex-col gap-2">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
              FilterCoffee
            </h1>
            <span className="text-3xl md:text-4xl font-bold tracking-tight text-muted">
              &ldquo;From Noise To Clarity&rdquo;
            </span>
          </div>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl">
            FilterCoffee transforms information overload into actionable intelligence. We process thousands of raw articles (Coffee Beans) through our filter system to deliver custom insights (Brews) tailored to your needs.
          </p>

          <div className="flex flex-wrap gap-4 mt-2 w-full sm:w-auto">
            <button
              onClick={handleEnterClick}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-base font-bold border border-foreground bg-foreground text-background px-6 py-3 rounded-md hover:opacity-90 transition-opacity focus:outline-none cursor-pointer animate-pulse-subtle"
            >
              ENTER <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="#features"
              className="flex-1 sm:flex-initial flex items-center justify-center text-base font-semibold border border-border bg-background hover:bg-card-hover px-6 py-3 rounded-md transition-colors"
            >
              Explore Features
            </Link>
          </div>
        </div>

        {/* Right hero cup graphic */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="relative w-72 h-72 md:w-96 md:h-96 bg-background flex items-center justify-center overflow-hidden">
            {/* Custom Smoky & Volumetric styles */}
            <style>{`
              @keyframes riseAndFade {
                0% {
                  transform: translateY(0) scale(0.6) translateX(0);
                  opacity: 0;
                }
                15% {
                  opacity: 0.95;
                }
                100% {
                  transform: translateY(-170px) scale(1.3) translateX(var(--drift));
                  opacity: 0;
                }
              }

              @keyframes smokeFlow {
                0% {
                  transform: translateY(0) scaleX(0.6) translateX(0);
                  opacity: 0;
                  filter: blur(6px);
                }
                18% {
                  opacity: 0.70;
                }
                100% {
                  transform: translateY(-200px) scaleX(2.4) translateX(var(--drift));
                  opacity: 0;
                  filter: blur(20px);
                }
              }

              @keyframes smokePuff {
                0% {
                  transform: translateY(0) scale(0.5) translateX(0);
                  opacity: 0;
                  filter: blur(8px);
                }
                20% {
                  opacity: 0.55;
                }
                100% {
                  transform: translateY(-220px) scale(3.5) translateX(var(--drift));
                  opacity: 0;
                  filter: blur(28px);
                }
              }

              .steam-particle {
                position: absolute;
                bottom: 140px;
                animation: riseAndFade var(--duration) infinite ease-out;
                animation-delay: var(--delay);
                font-size: var(--size);
                color: #8c6239;
                font-family: monospace;
                font-weight: 600;
                pointer-events: none;
                text-shadow: 0 0 6px rgba(214, 166, 116, 0.45);
              }

              :is(.dark) .steam-particle {
                color: rgba(255, 255, 255, 0.75);
                text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
              }

              .steam-cloud {
                position: absolute;
                bottom: 130px;
                background-color: rgba(140, 98, 57, 0.42);
                border-radius: 50%;
                animation: smokeFlow var(--duration) infinite ease-out;
                animation-delay: var(--delay);
                pointer-events: none;
                filter: blur(3px);
              }

              :is(.dark) .steam-cloud {
                background-color: rgba(255, 255, 255, 0.28);
              }

              .smoke-puff {
                position: absolute;
                bottom: 135px;
                border-radius: 50%;
                background-color: rgba(120, 80, 40, 0.38);
                animation: smokePuff var(--duration) infinite ease-out;
                animation-delay: var(--delay);
                pointer-events: none;
                filter: blur(10px);
              }

              :is(.dark) .smoke-puff {
                background-color: rgba(255, 255, 255, 0.24);
              }
            `}</style>

            {/* Volumetric Smoky Clouds */}
            {[
              { delay: '0s',   duration: '6s',   drift: '-18px', width: '36px', height: '36px', left: '44%' },
              { delay: '1.5s', duration: '7s',   drift: '22px',  width: '44px', height: '44px', left: '48%' },
              { delay: '3.2s', duration: '6.5s', drift: '-8px',  width: '40px', height: '40px', left: '41%' },
              { delay: '0.8s', duration: '8s',   drift: '12px',  width: '52px', height: '52px', left: '46%' },
              { delay: '2.4s', duration: '7.5s', drift: '-25px', width: '48px', height: '48px', left: '39%' },
              { delay: '4s',   duration: '6.8s', drift: '30px',  width: '42px', height: '42px', left: '54%' },
              { delay: '1.2s', duration: '8.5s', drift: '-10px', width: '56px', height: '56px', left: '43%' },
              { delay: '3s',   duration: '7.8s', drift: '18px',  width: '50px', height: '50px', left: '50%' },
              { delay: '4.8s', duration: '7.2s', drift: '-15px', width: '38px', height: '38px', left: '45%' },
              { delay: '2s',   duration: '8.2s', drift: '25px',  width: '46px', height: '46px', left: '52%' },
            ].map((cloud, idx) => (
              <div
                key={idx}
                className="steam-cloud"
                style={{
                  '--delay': cloud.delay,
                  '--duration': cloud.duration,
                  '--drift': cloud.drift,
                  width: cloud.width,
                  height: cloud.height,
                  left: cloud.left,
                } as React.CSSProperties}
              />
            ))}

            {/* Large Billowing Smoke Puffs */}
            {[
              { delay: '0s',   duration: '9s',  drift: '-22px', width: '65px', height: '65px', left: '42%' },
              { delay: '2s',   duration: '11s', drift: '28px',  width: '75px', height: '75px', left: '47%' },
              { delay: '4.5s', duration: '10s', drift: '-15px', width: '60px', height: '60px', left: '38%' },
              { delay: '3.2s', duration: '12s', drift: '20px',  width: '70px', height: '70px', left: '52%' },
              { delay: '1.5s', duration: '10.5s', drift: '-10px', width: '62px', height: '62px', left: '44%' },
              { delay: '5.5s', duration: '11.5s', drift: '25px',  width: '68px', height: '68px', left: '49%' },
            ].map((puff, idx) => (
              <div
                key={idx}
                className="smoke-puff"
                style={{
                  '--delay': puff.delay,
                  '--duration': puff.duration,
                  '--drift': puff.drift,
                  width: puff.width,
                  height: puff.height,
                  left: puff.left,
                } as React.CSSProperties}
              />
            ))}

            {/* Volumetric Text Particles */}
            {[
              { text: 'AI', delay: '0s', duration: '6s', size: '11px', drift: '-20px', left: '42%' },
              { text: 'signal', delay: '1s', duration: '5.5s', size: '12px', drift: '25px', left: '55%' },
              { text: 'data', delay: '2s', duration: '6.5s', size: '10px', drift: '5px', left: '48%' },
              { text: 'INR', delay: '0.5s', duration: '5s', size: '11px', drift: '15px', left: '52%' },
              { text: 'USD', delay: '1.5s', duration: '7s', size: '10px', drift: '-15px', left: '40%' },
              { text: 'feed', delay: '3s', duration: '6s', size: '12px', drift: '30px', left: '58%' },
              { text: 'AI', delay: '2.5s', duration: '5.8s', size: '9px', drift: '-10px', left: '45%' },
              { text: 'INR', delay: '3.5s', duration: '6.2s', size: '10px', drift: '10px', left: '50%' },
              { text: 'signal', delay: '4s', duration: '6.8s', size: '13px', drift: '20px', left: '53%' },
              { text: 'data', delay: '4.5s', duration: '5.4s', size: '10px', drift: '-25px', left: '38%' },
              { text: 'O', delay: '0.8s', duration: '4.8s', size: '9px', drift: '-5px', left: '46%' },
              { text: '()', delay: '2.2s', duration: '6.1s', size: '8px', drift: '18px', left: '49%' },
            ].map((part, idx) => (
              <span
                key={idx}
                className="steam-particle"
                style={{
                  '--delay': part.delay,
                  '--duration': part.duration,
                  '--size': part.size,
                  '--drift': part.drift,
                  left: part.left,
                } as React.CSSProperties}
              >
                {part.text}
              </span>
            ))}

            {/* Coffee Cup & Saucer Group */}
            <div className="relative flex flex-col items-center select-none pt-12 z-10 w-[300px] h-[180px]">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 300 180"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible"
              >
                <defs>
                  {/* Cup Body Clip Path */}
                  <clipPath id="cup-body-clip">
                    <path d="M 70,45 L 210,45 C 208,95 196,145 180,145 L 100,145 C 84,145 72,95 70,45 Z" />
                  </clipPath>
                  
                  {/* Handle Clip Path */}
                  <clipPath id="handle-clip">
                    <path d="M 204,56 C 225,50 255,52 262,76 C 268,96 248,118 190,128 C 192,122 195,116 195,116 C 236,109 250,93 246,80 C 240,65 220,64 205,68 Z" />
                  </clipPath>
                </defs>

                {/* Table/Surface Shadow under Saucer */}
                <ellipse cx="140" cy="166" rx="95" ry="7" fill="rgba(0,0,0,0.06)" />

                {/* Saucer Body (Base) */}
                <path
                  d="M 40,146 C 40,146 140,148 240,146 C 240,154 210,166 140,166 C 70,166 40,154 40,146 Z"
                  className="fill-[#5C4033] dark:fill-white transition-colors duration-300"
                />

                {/* Saucer Top Surface Highlight */}
                <path
                  d="M 40,146 C 40,146 140,148 240,146 C 235,149 140,150 40,146 Z"
                  className="fill-[#7A5545] dark:fill-[#F2F2F2] transition-colors duration-300"
                />

                {/* Saucer Inner Shadow (directly under cup base) */}
                <ellipse cx="140" cy="146" rx="42" ry="3.5" fill="rgba(0,0,0,0.18)" className="dark:fill-black/30" />

                {/* Saucer Bottom Rim Highlight */}
                <path
                  d="M 50,152 C 90,162 190,162 230,152 C 210,164 140,165 50,152 Z"
                  className="fill-[#6B4B3D] dark:fill-[#E6E6E6] transition-colors duration-300"
                />

                {/* Cup Body (With Clipping for Shading) */}
                <g clipPath="url(#cup-body-clip)">
                  {/* Cup Base Color */}
                  <rect
                    x="50"
                    y="30"
                    width="180"
                    height="130"
                    className="fill-[#5C4033] dark:fill-white transition-colors duration-300"
                  />
                  {/* Diagonal Shadow */}
                  <polygon
                    points="130,30 230,30 230,160 155,160"
                    className="fill-[#4A3227] dark:fill-[#E6E6E6] transition-colors duration-300"
                  />
                  {/* Left Side Highlight */}
                  <path
                    d="M 70,45 C 72,95 84,145 100,145 C 90,135 80,95 78,45 Z"
                    className="fill-[#7A5545] dark:fill-[#F2F2F2] opacity-80 dark:opacity-100 transition-colors duration-300"
                  />
                </g>

                {/* Handle (With Clipping for Shading) */}
                <g clipPath="url(#handle-clip)">
                  {/* Handle Base Color */}
                  <rect
                    x="180"
                    y="40"
                    width="90"
                    height="100"
                    className="fill-[#5C4033] dark:fill-white transition-colors duration-300"
                  />
                  {/* Handle Shadow (Bottom/Inner curve) */}
                  <path
                    d="M 195,116 C 236,109 250,93 246,80 L 262,76 C 268,96 248,118 190,128 Z"
                    className="fill-[#4A3227] dark:fill-[#E6E6E6] transition-colors duration-300"
                  />
                  {/* Handle Highlight (Top/Outer curve) */}
                  <path
                    d="M 204,56 C 225,50 255,52 262,76 C 246,80 240,65 205,68 Z"
                    className="fill-[#7A5545] dark:fill-[#F2F2F2] transition-colors duration-300"
                  />
                </g>
              </svg>
            </div>

          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-b border-border">
        <div className="flex flex-col items-center gap-4 text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-muted font-bold">
            Insight Engine
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">
            FILTERCOFFEE INSIGHTS
          </h2>
          <div className="h-0.5 w-12 bg-foreground" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {insights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-lg border border-border bg-card flex flex-col justify-between gap-6 hover:bg-card-hover transition-colors"
              >
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 border border-border rounded-md flex items-center justify-center bg-background">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1 text-xs font-bold hover:text-muted transition-colors focus:outline-none"
                >
                  Learn More <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Category Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-b border-border">
        <div className="flex flex-col items-center gap-4 text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-muted font-bold">
            Live Feeds
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">
            LIVE AI INTELLIGENCE CAFE
          </h2>
          <div className="h-0.5 w-12 bg-foreground" />
        </div>

        <div className="p-6 md:p-8 rounded-lg border border-border bg-card shadow-lg flex flex-col gap-6 w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-foreground font-mono">
                FRESHLY BREWED TODAY (SIGNALS STREAM)
              </span>
            </div>
            <span className="text-[10px] font-medium text-muted font-mono">
              Interval: 1 week
            </span>
          </div>

          {/* List items */}
          <div className="flex flex-col gap-6">
            {updates.map((update, idx) => (
              <div key={idx} className="flex gap-4 items-start border-b border-border/40 pb-5 last:border-b-0 last:pb-0">
                <div className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${update.badgeClass} flex-shrink-0 min-w-[75px] text-center`}>
                  {update.category}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-foreground">
                    {update.headline}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {update.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Preview Section */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center gap-4 text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-muted font-bold">
            Pricing Plans
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">
            SUBSCRIPTION PREVIEW
          </h2>
          <div className="h-0.5 w-12 bg-foreground" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1: Free */}
          <div className="p-6 rounded-lg border border-border bg-card flex flex-col justify-between gap-8 hover:bg-card-hover transition-colors">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="font-extrabold text-sm uppercase tracking-widest">FREE</span>
                <span className="text-2xl font-black">₹0</span>
              </div>
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  3 Active Topics
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Email Summary
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Saved Brew
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="w-full text-center py-2.5 rounded-md border border-foreground bg-background text-foreground font-semibold text-sm hover:bg-foreground hover:text-background transition-colors focus:outline-none"
            >
              Get Started
            </Link>
          </div>

          {/* Card 2: Pro */}
          <div className="p-6 rounded-lg border-2 border-foreground bg-card flex flex-col justify-between gap-8 relative shadow-lg">
            <div className="absolute -top-3 right-4 px-2 py-0.5 rounded border border-foreground bg-foreground text-background text-[10px] uppercase font-bold">
              Popular
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="font-extrabold text-sm uppercase tracking-widest">PRO</span>
                <span className="text-2xl font-black">₹599<span className="text-xs font-normal text-muted">/mo</span></span>
              </div>
              <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2 font-semibold text-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  10 Active Topics
                </li>
                <li className="flex items-center gap-2 font-semibold text-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Email Updates
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Voice News (Brewing Wave)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Saved Brew History
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  Priority Features
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="w-full text-center py-2.5 rounded-md border border-foreground bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity focus:outline-none"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
