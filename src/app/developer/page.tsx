'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { Terminal, Cpu, Database, Activity, ArrowLeft, RefreshCw } from 'lucide-react';

interface IngestionLog {
  id: string;
  status: string;
  items_imported: number;
  error_message: string | null;
  created_at: string;
}

function DeveloperPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const { profile, loading: appLoading } = useApp();

  const [authorized, setAuthorized] = useState(false);
  const [testingConnection, setTestingConnection] = useState(true);
  const [stats, setStats] = useState({
    apiHealth: '100%',
    averageLatency: '0ms',
    supabaseState: 'Connected',
  });
  const [traces, setTraces] = useState<string[]>([]);
  const [rssLogs, setRssLogs] = useState<IngestionLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Check authorization
  useEffect(() => {
    if (!appLoading) {
      const isDeveloper = profile?.is_developer === true || roleParam === 'developer';
      setAuthorized(isDeveloper);
    }
  }, [profile, roleParam, appLoading]);

  const fetchRssLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('rss_ingestion_logs')
        .select('*')
        .neq('status', 'CLEANUP')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRssLogs(data as IngestionLog[] || []);
    } catch (err) {
      console.error('Failed to fetch developer RSS logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const runConnectionDiagnostics = async () => {
    setTestingConnection(true);
    try {
      const connectionTraces: string[] = [];
      let totalLatency = 0;
      let successfulQueries = 0;

      // 1. Articles query trace
      const startArticles = performance.now();
      const { error: articlesErr } = await supabase
        .from('articles')
        .select('id')
        .limit(1);
      const endArticles = performance.now();
      const articlesLatency = Math.round(endArticles - startArticles);

      if (!articlesErr) {
        successfulQueries++;
        totalLatency += articlesLatency;
        connectionTraces.push(
          `GET /rest/v1/articles?select=id&limit=1 200 OK ${articlesLatency}ms - Supabase JS SDK v2`
        );
      } else {
        connectionTraces.push(
          `GET /rest/v1/articles?select=id&limit=1 500 Internal Error - ${articlesErr.message}`
        );
      }

      // 2. Profiles query trace
      const startProfiles = performance.now();
      const { error: profilesErr } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      const endProfiles = performance.now();
      const profilesLatency = Math.round(endProfiles - startProfiles);

      if (!profilesErr) {
        successfulQueries++;
        totalLatency += profilesLatency;
        connectionTraces.push(
          `GET /rest/v1/profiles?select=id&limit=1 200 OK ${profilesLatency}ms - Supabase JS SDK v2`
        );
      } else {
        connectionTraces.push(
          `GET /rest/v1/profiles?select=id&limit=1 500 Internal Error - ${profilesErr.message}`
        );
      }

      // 3. Saved Articles count query trace
      const startSaved = performance.now();
      const { error: savedErr } = await supabase
        .from('saved_articles')
        .select('id')
        .limit(1);
      const endSaved = performance.now();
      const savedLatency = Math.round(endSaved - startSaved);

      if (!savedErr) {
        successfulQueries++;
        totalLatency += savedLatency;
        connectionTraces.push(
          `GET /rest/v1/saved_articles?select=id&limit=1 200 OK ${savedLatency}ms - Supabase JS SDK v2`
        );
      } else {
        connectionTraces.push(
          `GET /rest/v1/saved_articles?select=id&limit=1 500 Internal Error - ${savedErr.message}`
        );
      }

      const avg = successfulQueries > 0 ? Math.round(totalLatency / successfulQueries) : 0;
      const successPercent = Math.round((successfulQueries / 3) * 100);

      setStats({
        apiHealth: `${successPercent}%`,
        averageLatency: `${avg}ms`,
        supabaseState: successPercent > 0 ? 'Connected' : 'Disconnected',
      });
      setTraces(connectionTraces);
    } catch (err) {
      console.error('Failed to execute API diagnostic connection trace:', err);
      setStats({
        apiHealth: '0%',
        averageLatency: 'Error',
        supabaseState: 'Disconnected',
      });
      setTraces([`[ERROR] Connection diagnostic failed: ${(err as Error).message}`]);
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      runConnectionDiagnostics();
      fetchRssLogs();
    }
  }, [authorized]);

  if (appLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <span className="text-sm font-medium animate-pulse">Checking credentials...</span>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md p-6 rounded-lg border border-border bg-card text-center flex flex-col gap-6">
          <div className="relative w-16 h-16 mx-auto bg-card border border-border rounded-full flex items-center justify-center">
            <Terminal className="w-8 h-8 text-red-500" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-sm text-muted">
              You do not have developer permissions to view this API console.
            </p>
          </div>
          <button
            onClick={() => router.push('/home')}
            className="w-full py-2.5 rounded-md border border-foreground bg-foreground text-background font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">

        {/* Developer API Console panel */}
        <div className="p-6 rounded-lg border-2 border-foreground bg-card flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              <h2 className="font-bold text-base uppercase tracking-wider">Developer API Console</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  runConnectionDiagnostics();
                  fetchRssLogs();
                }}
                disabled={testingConnection}
                className="p-1 rounded border border-border hover:bg-card-hover text-muted hover:text-foreground transition-colors disabled:opacity-50"
                title="Recalculate latency traces"
                aria-label="Refresh telemetry details"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              </button>
              <span className="text-xs font-semibold px-2 py-0.5 rounded border border-foreground bg-foreground text-background">
                Developer Mode
              </span>
            </div>
          </div>

          {testingConnection ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
              <div className="h-20 bg-border/50 border border-border rounded" />
              <div className="h-20 bg-border/50 border border-border rounded" />
              <div className="h-20 bg-border/50 border border-border rounded" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded border border-border bg-background flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted">API Health</span>
                <span className={`text-xl font-bold flex items-center gap-1.5 ${stats.apiHealth === '100%' ? 'text-green-500' : 'text-yellow-500'}`}>
                  <Cpu className="w-4.5 h-4.5" /> {stats.apiHealth}
                </span>
              </div>
              <div className="p-4 rounded border border-border bg-background flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted">Average Latency</span>
                <span className="text-xl font-bold flex items-center gap-1.5">
                  <Activity className="w-4.5 h-4.5 text-muted" /> {stats.averageLatency}
                </span>
              </div>
              <div className="p-4 rounded border border-border bg-background flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted">Supabase State</span>
                <span className={`text-xl font-bold flex items-center gap-1.5 ${stats.supabaseState === 'Connected' ? 'text-green-500' : 'text-red-500'}`}>
                  <Database className="w-4.5 h-4.5" /> {stats.supabaseState}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" /> API Connection Traces
            </span>
            <div className="p-4 bg-background border border-border rounded text-[11px] font-mono text-muted-foreground min-h-24 max-h-48 overflow-y-auto leading-relaxed flex flex-col gap-1.5">
              {testingConnection ? (
                <span className="animate-pulse">Performing real-time latency diagnostics...</span>
              ) : (
                traces.map((trace, idx) => (
                  <div key={idx} className="break-all whitespace-pre-wrap">
                    {trace}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Read-only logs panel for developers */}
        <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-4">
          <h3 className="font-bold text-base uppercase tracking-wider border-b border-border pb-2">
            Parser Log Output (Ingestion Activity)
          </h3>
          <div className="overflow-x-auto border border-border rounded-lg bg-background">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="p-2.5 font-bold uppercase tracking-wider text-muted">Time</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-muted">Status</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-muted">Import Count</th>
                  <th className="p-2.5 font-bold uppercase tracking-wider text-muted">Error Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-muted-foreground">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center italic text-muted animate-pulse">Loading activity logs...</td>
                  </tr>
                ) : rssLogs.length > 0 ? (
                  rssLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="p-2.5 text-foreground">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          log.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' 
                          : log.status === 'PARTIAL' ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-red-500/10 text-red-500'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-foreground">{log.items_imported} items</td>
                      <td className="p-2.5 max-w-[300px] truncate" title={log.error_message || ''}>
                        {log.error_message || 'None'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center italic text-muted">No logs recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

export default function DeveloperPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <span className="text-sm font-medium animate-pulse">Brewing FilterCoffee...</span>
      </div>
    }>
      <DeveloperPageContent />
    </Suspense>
  );
}
