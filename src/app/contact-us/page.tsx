'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { FAQAccordion } from '@/components/ui/FAQAccordion';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { Mail, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function ContactUsPage() {
  const { profile } = useApp();

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Auto-fill name and email from user profile
  useEffect(() => {
    if (profile) {
      if (profile.nickname) setName(profile.nickname);
      if (profile.email) setEmail(profile.email);
    }
  }, [profile]);

  // States
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch FAQs from Supabase
  useEffect(() => {
    async function loadFAQs() {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*');
        if (error) throw error;
        setFaqs(data || []);
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      }
    }
    loadFAQs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      // Save contact submission into Supabase contact_submissions table
      const { error: submitError } = await supabase
        .from('contact_submissions')
        .insert({
          name,
          email,
          subject,
          message,
        });

      if (submitError) throw submitError;

      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Contact submit error:', err);
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        
        {/* Heading */}
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Contact Us</h1>
          <p className="text-xs text-muted">
            Have questions or feedback? Reach out to the FilterCoffee team below.
          </p>
        </div>

        {/* Layout split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2 items-start">
          
          {/* Left Column: Form details */}
          <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-5">
            <h2 className="font-bold text-base uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
              <MessageSquare className="w-4.5 h-4.5 text-muted" /> Send Message
            </h2>

            {success && (
              <div className="p-3 rounded-md border border-green-500/20 bg-green-500/5 text-green-500 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Your message has been sent successfully. We will get back to you shortly.</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-md border border-red-500/20 bg-red-500/5 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                />
                {profile?.email && (
                  <span className="text-[10px] text-muted">Auto-filled from your account · You can edit this</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-subject" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message here..."
                  className="p-3 rounded-md border border-border bg-background text-sm focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full py-2.5 rounded-md border border-foreground bg-foreground text-background font-semibold text-xs hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 focus:outline-none"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Right Column: FAQ Accordion */}
          <div className="flex flex-col gap-5">
            <h2 className="font-bold text-base uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
              <Mail className="w-4.5 h-4.5 text-muted" /> Frequently Asked Questions
            </h2>
            
            {faqs.length > 0 ? (
              <FAQAccordion items={faqs} />
            ) : (
              <div className="h-40 border border-dashed border-border rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-xs text-muted">Loading FAQ modules...</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </AppShell>
  );
}
