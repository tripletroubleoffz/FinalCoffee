'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { Article } from '@/context/AppContext';

interface AudioPlayerProps {
  article: Article | null;
}

export function AudioPlayer({ article }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // character index
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Construct text to read
  const textToSpeak = article 
    ? `${article.headline}. Category: ${article.category}. Summary: ${article.summary}.`
    : '';
  
  const duration = textToSpeak.length;

  // Track current character position using a ref to prevent race conditions during updates
  const charIndexRef = useRef(0);

  useEffect(() => {
    // Reset player states when active article changes
    setIsPlaying(false);
    setCurrentTime(0);
    charIndexRef.current = 0;
    
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
  }, [article]);

  // Handle playback rate changes
  useEffect(() => {
    if (isPlaying && typeof window !== 'undefined') {
      speakText(textToSpeak, currentTime);
    }
  }, [playbackRate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string, startFromChar: number) => {
    if (typeof window === 'undefined') return;

    window.speechSynthesis.cancel();

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text.substring(startFromChar));
    utterance.rate = playbackRate;
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const absoluteIndex = startFromChar + event.charIndex;
        setCurrentTime(absoluteIndex);
        charIndexRef.current = absoluteIndex;
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      charIndexRef.current = 0;
    };

    utterance.onerror = (e) => {
      // Ignore boundary errors caused by cancel/interruptions
      if (e.error !== 'interrupted') {
        console.error('Speech Synthesis error:', e);
        setIsPlaying(false);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (typeof window === 'undefined' || !article) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        speakText(textToSpeak, currentTime);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekIndex = parseInt(e.target.value, 10);
    setCurrentTime(seekIndex);
    charIndexRef.current = seekIndex;
    
    if (isPlaying) {
      speakText(textToSpeak, seekIndex);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
  };

  // Convert character count to estimated time (assume average speed ~15 chars per second)
  const formatTime = (charCount: number) => {
    const estimatedSeconds = Math.round(charCount / 15);
    const mins = Math.floor(estimatedSeconds / 60);
    const secs = Math.floor(estimatedSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestart = () => {
    if (typeof window === 'undefined') return;
    
    window.speechSynthesis.cancel();
    setCurrentTime(0);
    charIndexRef.current = 0;
    
    if (isPlaying) {
      speakText(textToSpeak, 0);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Hero Audio Player Deck */}
      <div className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-lg border border-border bg-card">
        {/* Visual wave representation */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg bg-background border border-border flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted flex items-center justify-center group-hover:scale-110 transition-transform">
              <Volume2 className={`w-8 h-8 text-muted ${isPlaying ? 'animate-bounce' : ''}`} />
            </div>
            
            <div className="absolute bottom-1/4 flex gap-1 justify-center w-full">
              <span className={`w-1 h-3 rounded-full bg-muted/30 ${isPlaying ? 'animate-pulse' : ''}`} style={{ animationDelay: '0ms' }} />
              <span className={`w-1 h-4 rounded-full bg-muted/40 ${isPlaying ? 'animate-pulse' : ''}`} style={{ animationDelay: '200ms' }} />
              <span className={`w-1 h-2 rounded-full bg-muted/30 ${isPlaying ? 'animate-pulse' : ''}`} style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        </div>

        {/* Controls Deck */}
        <div className="flex-1 w-full flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest text-muted font-bold">
              {article ? `${article.category} • AI News Reader` : 'Select an article to listen'}
            </span>
            <h3 className="text-xl font-bold tracking-tight mt-1 line-clamp-1">
              {article ? article.headline : 'No Active Selection'}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {article ? 'Speech Synthesis voice streaming' : 'Convert text summary to voice instantly'}
            </p>
          </div>

          {/* Progress Slider */}
          <div className="flex flex-col gap-1 w-full">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={!article}
              className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-foreground focus:outline-none"
              aria-label="Seek progress"
            />
            <div className="flex justify-between items-center text-xs text-muted font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Media Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestart}
                disabled={!article}
                className="p-2 rounded-md border border-border hover:bg-card-hover text-muted hover:text-foreground disabled:opacity-50 transition-colors"
                aria-label="Restart audio"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={!article}
                className="p-3.5 rounded-full border border-foreground bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity focus:outline-none"
                aria-label={isPlaying ? 'Pause' : 'Listen'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-background" /> : <Play className="w-5 h-5 fill-background ml-0.5" />}
              </button>
            </div>

            {/* Playback Speed selector chips */}
            <div className="flex items-center gap-1.5 border border-border p-1 rounded-md bg-background">
              {[1, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  disabled={!article}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-sm transition-colors ${
                    playbackRate === speed
                      ? 'bg-foreground text-background'
                      : 'text-muted hover:bg-card-hover hover:text-foreground'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transcript & Summary side-by-side splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summary Card */}
        <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Brew Summary
          </h4>
          <div className="text-sm leading-relaxed text-muted-foreground">
            {article ? (
              <p>{article.summary}</p>
            ) : (
              <p className="italic text-xs">Select an article to load summary...</p>
            )}
          </div>
        </div>

        {/* Transcript Card */}
        <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Live Transcript
          </h4>
          <div className="text-sm leading-relaxed text-muted-foreground max-h-48 overflow-y-auto pr-2">
            {article ? (
              <p className="whitespace-pre-line">
                {article.transcript || `${article.headline}. ${article.summary}`}
              </p>
            ) : (
              <p className="italic text-xs">Select an article to load transcript...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
