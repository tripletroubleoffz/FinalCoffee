'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { Shield, Users, Server, Activity, ArrowLeft, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle, Terminal, UserPlus, UserMinus } from 'lucide-react';

interface RssSource {
  id: string;
  name: string;
  url: string;
  category: 'AI' | 'Technology' | 'Startups' | 'Engineering' | 'SaaS' | 'Cybersecurity' | 'Finance';
  created_at: string;
}

interface IngestionLog {
  id: string;
  status: string;
  items_imported: number;
  error_message: string | null;
  created_at: string;
}

interface PendingRequest {
  id: string;
  nickname: string;
  email: string;
  pro_request_status: string;
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const { profile, loading: appLoading } = useApp();

  const [authorized, setAuthorized] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    serverStatus: 'Healthy',
    proCount: 0,
    freeCount: 0,
  });
  
  // RSS States
  const [rssSources, setRssSources] = useState<RssSource[]>([]);
  const [loadingRss, setLoadingRss] = useState(true);
  const [rssLogs, setRssLogs] = useState<IngestionLog[]>([]);
  
  // Add RSS Form State
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<'AI' | 'Technology' | 'Startups' | 'Engineering' | 'SaaS' | 'Cybersecurity' | 'Finance'>('AI');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [addingSource, setAddingSource] = useState(false);

  // Syncing State
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ status: string; imported: number; error: string | null } | null>(null);

  // Developer Management States
  interface DeveloperProfile {
    id: string;
    nickname: string;
    email: string;
    is_developer: boolean;
  }
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [loadingDevs, setLoadingDevs] = useState(true);
  const [devEmail, setDevEmail] = useState('');
  const [devError, setDevError] = useState('');
  const [devSuccess, setDevSuccess] = useState('');
  const [addingDev, setAddingDev] = useState(false);

  // Check authorization
  useEffect(() => {
    if (!appLoading) {
      const isAdmin = profile?.is_admin === true || roleParam === 'admin';
      setAuthorized(isAdmin);
    }
  }, [profile, roleParam, appLoading]);

  // Load RSS Sources
  const fetchRssSources = async () => {
    setLoadingRss(true);
    try {
      const { data, error } = await supabase
        .from('rss_sources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRssSources(data as RssSource[] || []);
    } catch (err) {
      console.error('Failed to load RSS sources:', err);
    } finally {
      setLoadingRss(false);
    }
  };

  // Load RSS Logs
  const fetchRssLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('rss_ingestion_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRssLogs(data as IngestionLog[] || []);
    } catch (err) {
      console.error('Failed to load RSS logs:', err);
    }
  };

  // Fetch real statistics
  const fetchAdminStats = async () => {
    setLoadingStats(true);
    try {
      const startTime = performance.now();

      // 1. Get total user profiles count
      const { count: totalCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // 2. Get PRO subscriptions count
      const { count: proCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'PRO');

      // 3. Get FREE/Other subscriptions count
      const { count: freeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('subscription_status', 'PRO');

      setStats({
        totalUsers: totalCount || 0,
        serverStatus: 'Healthy',
        proCount: proCount || 0,
        freeCount: freeCount || 0,
      });

    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setStats((prev) => ({ ...prev, serverStatus: 'Offline' }));
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, email, pro_request_status')
        .eq('pro_request_status', 'PENDING')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPendingRequests((data as any[]) || []);
    } catch (err) {
      console.error('Failed to load pending PRO requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'PRO',
          pro_request_status: 'APPROVED'
        })
        .eq('id', userId);

      if (error) throw error;

      fetchPendingRequests();
      fetchAdminStats();
    } catch (err: any) {
      console.error('Failed to approve PRO request:', err);
      alert('Error approving request: ' + err.message);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    if (!confirm('Are you sure you want to decline this upgrade request?')) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          pro_request_status: 'REJECTED'
        })
        .eq('id', userId);

      if (error) throw error;

      fetchPendingRequests();
    } catch (err: any) {
      console.error('Failed to reject PRO request:', err);
      alert('Error rejecting request: ' + err.message);
    }
  };

  const fetchDevelopers = async () => {
    setLoadingDevs(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, email, is_developer')
        .eq('is_developer', true)
        .order('nickname', { ascending: true });

      if (error) throw error;
      setDevelopers((data as DeveloperProfile[]) || []);
    } catch (err) {
      console.error('Failed to load developers:', err);
    } finally {
      setLoadingDevs(false);
    }
  };

  const handlePromoteDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevError('');
    setDevSuccess('');

    const targetEmail = devEmail.trim().toLowerCase();
    if (!targetEmail) {
      setDevError('Please enter a valid email address.');
      return;
    }

    setAddingDev(true);
    try {
      // Find profile by email
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, is_admin')
        .eq('email', targetEmail)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        setDevError('User profile not found with this email. Users must sign up first.');
        return;
      }

      if (data.is_admin) {
        setDevError('An admin account cannot be promoted to developer.');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_developer: true })
        .eq('id', data.id);

      if (updateError) throw updateError;

      setDevSuccess(`User ${devEmail.trim()} successfully promoted to developer.`);
      setDevEmail('');
      fetchDevelopers();
    } catch (err: any) {
      console.error('Failed to promote user:', err);
      setDevError(err.message || 'Failed to promote user.');
    } finally {
      setAddingDev(false);
    }
  };

  const handleDemoteDeveloper = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove developer permissions from ${email}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_developer: false })
        .eq('id', userId);

      if (error) throw error;
      fetchDevelopers();
    } catch (err: any) {
      console.error('Failed to demote developer:', err);
      alert('Failed to demote developer: ' + err.message);
    }
  };

  useEffect(() => {
    if (authorized) {
      fetchAdminStats();
      fetchRssSources();
      fetchRssLogs();
      fetchPendingRequests();
      fetchDevelopers();
    }
  }, [authorized]);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!newName.trim() || !newUrl.trim()) {
      setFormError('Please enter both name and URL.');
      return;
    }

    setAddingSource(true);
    try {
      const { error } = await supabase
        .from('rss_sources')
        .insert({
          name: newName.trim(),
          url: newUrl.trim(),
          category: newCategory
        });

      if (error) throw error;

      setFormSuccess('RSS source added successfully.');
      setNewName('');
      setNewUrl('');
      fetchRssSources();
    } catch (err: any) {
      console.error('Failed to add RSS source:', err);
      setFormError(err.message || 'Failed to add RSS source. Make sure URL is unique.');
    } finally {
      setAddingSource(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this RSS source?')) return;
    try {
      const { error } = await supabase
        .from('rss_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchRssSources();
    } catch (err) {
      console.error('Failed to delete RSS source:', err);
      alert('Failed to delete RSS source.');
    }
  };

  const handleSyncFeeds = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/rss/fetch', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        setSyncResult({
          status: data.status,
          imported: data.imported,
          error: data.errors
        });
        fetchRssLogs();
        fetchAdminStats();
      } else {
        setSyncResult({
          status: 'FAILURE',
          imported: 0,
          error: data.error || 'Failed to parse feeds.'
        });
      }
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncResult({
        status: 'FAILURE',
        imported: 0,
        error: err.message
      });
    } finally {
      setSyncing(false);
    }
  };

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
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-sm text-muted">
              You do not have administrative permissions to view this control console.
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
        
        {/* Admin Control Console panel */}
        <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <h2 className="font-bold text-base uppercase tracking-wider">Admin Control Console</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded border border-foreground bg-foreground text-background">
              Admin Mode
            </span>
          </div>

          {loadingStats ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
              <div className="h-20 bg-border/50 border border-border rounded" />
              <div className="h-20 bg-border/50 border border-border rounded" />
              <div className="h-20 bg-border/50 border border-border rounded" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded border border-border bg-background flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted">Total Users</span>
                <span className="text-xl font-bold flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-muted" /> {stats.totalUsers}
                </span>
              </div>
              <div className="p-4 rounded border border-border bg-background flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted">Server Status</span>
                <span className={`text-xl font-bold flex items-center gap-1.5 ${stats.serverStatus === 'Healthy' ? 'text-green-500' : 'text-red-500'}`}>
                  <Server className="w-4.5 h-4.5" /> {stats.serverStatus}
                </span>
              </div>
              <div className="p-4 rounded border border-border bg-background flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted">Active Subscriptions</span>
                <span className="text-xl font-bold">
                  PRO: {stats.proCount} | FREE: {stats.freeCount}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* PRO Plan Upgrade Requests Section */}
        <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-4">
          <h3 className="font-bold text-base uppercase tracking-wider border-b border-border pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-4.5 h-4.5" />
              PRO Plan Upgrade Requests
            </span>
            <button
              onClick={fetchPendingRequests}
              disabled={loadingRequests}
              className="p-1 rounded border border-border hover:bg-card-hover text-muted hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh requests"
              aria-label="Refresh requests"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin' : ''}`} />
            </button>
          </h3>

          <div className="overflow-x-auto border border-border rounded-lg bg-background">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="p-3 font-bold uppercase tracking-wider text-muted">User Nickname</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-muted">Email</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-muted">Status</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                {loadingRequests ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center italic text-muted animate-pulse">Loading pending upgrade requests...</td>
                  </tr>
                ) : pendingRequests.length > 0 ? (
                  pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-card-hover transition-colors">
                      <td className="p-3 font-bold text-foreground">{req.nickname || 'Anonymous User'}</td>
                      <td className="p-3 font-mono">{req.email}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] uppercase font-mono tracking-wider">
                          {req.pro_request_status}
                        </span>
                      </td>
                      <td className="p-3 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="px-3 py-1 rounded bg-foreground text-background font-bold text-[10px] uppercase hover:opacity-90 transition-opacity cursor-pointer border border-foreground"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-3 py-1 rounded bg-background text-foreground font-bold text-[10px] uppercase hover:bg-card-hover transition-colors cursor-pointer border border-border"
                        >
                          Decline
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center italic text-muted">No pending PRO upgrade requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Developer Roles Management */}
        <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-4">
          <h3 className="font-bold text-base uppercase tracking-wider border-b border-border pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Terminal className="w-4.5 h-4.5" />
              Developer Roles Management
            </span>
            <button
              onClick={fetchDevelopers}
              disabled={loadingDevs}
              className="p-1 rounded border border-border hover:bg-card-hover text-muted hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh developers list"
              aria-label="Refresh developers list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDevs ? 'animate-spin' : ''}`} />
            </button>
          </h3>

          {/* Add Developer Form */}
          <form onSubmit={handlePromoteDeveloper} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border border-border rounded-lg bg-background items-end">
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <label htmlFor="dev-email-input" className="text-[10px] uppercase font-bold text-muted">Promote User to Developer (Email)</label>
              <input
                id="dev-email-input"
                type="email"
                required
                placeholder="e.g. developer@filtercoffee.ai"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                className="h-9 px-2.5 rounded border border-border bg-card text-xs focus:outline-none"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={addingDev}
                className="w-full h-9 border border-foreground bg-foreground text-background rounded flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity gap-1.5 text-xs font-bold"
                title="Add Developer"
                aria-label="Add Developer"
              >
                <UserPlus className="w-4 h-4" /> Add Developer
              </button>
            </div>
          </form>

          {devError && (
            <div className="p-3 rounded-md border border-red-500/20 bg-red-500/5 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{devError}</span>
            </div>
          )}

          {devSuccess && (
            <div className="p-3 rounded-md border border-green-500/20 bg-green-500/5 text-green-500 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{devSuccess}</span>
            </div>
          )}

          {/* Current Developers List */}
          <div className="overflow-x-auto border border-border rounded-lg bg-background">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="p-3 font-bold uppercase tracking-wider text-muted">Developer Nickname</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-muted">Email</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-muted">Permissions</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-muted text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                {loadingDevs ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center italic text-muted animate-pulse">Loading developers list...</td>
                  </tr>
                ) : developers.length > 0 ? (
                  developers.map((dev) => (
                    <tr key={dev.id} className="hover:bg-card-hover transition-colors">
                      <td className="p-3 font-bold text-foreground">{dev.nickname || 'Anonymous'}</td>
                      <td className="p-3 font-mono">{dev.email}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] uppercase font-mono tracking-wider">
                          Developer Mode
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDemoteDeveloper(dev.id, dev.email)}
                          className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors focus:outline-none cursor-pointer"
                          title="Demote Developer"
                          aria-label={`Demote ${dev.email}`}
                        >
                          <UserMinus className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center italic text-muted">No developers configured.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sync Controls Card */}
        <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-5">
          <h3 className="font-bold text-base uppercase tracking-wider border-b border-border pb-2 flex items-center justify-between">
            <span>RSS Feeds Synchronizer</span>
            <button
              onClick={handleSyncFeeds}
              disabled={syncing}
              className="flex items-center gap-1.5 text-xs font-semibold border border-foreground bg-foreground text-background px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchronizing...' : 'Sync Feeds Now'}
            </button>
          </h3>

          {syncResult && (
            <div className={`p-4 rounded-md border text-xs flex flex-col gap-2 ${
              syncResult.status === 'SUCCESS'
                ? 'border-green-500/20 bg-green-500/5 text-green-500'
                : syncResult.status === 'PARTIAL'
                ? 'border-amber-500/20 bg-amber-500/5 text-amber-500'
                : 'border-red-500/20 bg-red-500/5 text-red-500'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {syncResult.status === 'SUCCESS' ? <CheckCircle className="w-4 h-4" /> : syncResult.status === 'PARTIAL' ? <AlertCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>Sync Complete: {syncResult.status}</span>
              </div>
              <p>Successfully imported {syncResult.imported} new articles from configured RSS sources.</p>
              {syncResult.error && <p className="font-mono mt-1 opacity-80">Feed Errors: {syncResult.error}</p>}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Recent Ingestion Activity Logs
            </span>
            <div className="overflow-x-auto border border-border rounded-lg bg-background">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="p-2.5 font-bold uppercase tracking-wider text-muted">Timestamp</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider text-muted">Status</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider text-muted">Imported Count</th>
                    <th className="p-2.5 font-bold uppercase tracking-wider text-muted">Issues / Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-muted-foreground">
                  {rssLogs.length > 0 ? (
                    rssLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="p-2.5 text-foreground">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${log.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-foreground">{log.items_imported} items</td>
                        <td className="p-2.5 max-w-[200px] truncate" title={log.error_message || ''}>
                          {log.error_message || 'None'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center italic text-muted">No ingestion attempts recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RSS Management System */}
        <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-6">
          <h3 className="font-bold text-base uppercase tracking-wider border-b border-border pb-2">
            Configurable RSS Feeds
          </h3>

          <form onSubmit={handleAddSource} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg bg-background items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-muted">Source Name</label>
              <input
                type="text"
                required
                placeholder="e.g. OpenAI Research"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-9 px-2.5 rounded border border-border bg-card text-xs focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-muted">Feed RSS URL</label>
              <input
                type="url"
                required
                placeholder="https://example.com/rss.xml"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="h-9 px-2.5 rounded border border-border bg-card text-xs focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-muted">Category</label>
              <div className="flex gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="h-9 px-2.5 rounded border border-border bg-card text-xs focus:outline-none flex-grow"
                >
                  <option value="AI">AI</option>
                  <option value="Technology">Technology</option>
                  <option value="Startups">Startups</option>
                  <option value="Engineering">Engineering</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Finance">Finance</option>
                </select>
                <button
                  type="submit"
                  disabled={addingSource}
                  className="h-9 w-9 border border-foreground bg-foreground text-background rounded flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity"
                  title="Add source"
                  aria-label="Add RSS source"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {formError && (
            <div className="p-3 rounded-md border border-red-500/20 bg-red-500/5 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 rounded-md border border-green-500/20 bg-green-500/5 text-green-500 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* List of feeds */}
          <div className="overflow-x-auto border border-border rounded-lg bg-background">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="p-3 font-bold uppercase tracking-wider text-muted">Name</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-muted">Category</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-muted">RSS Feed Link</th>
                  <th className="p-3 font-bold uppercase tracking-wider text-muted text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                {loadingRss ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center italic text-muted animate-pulse">Loading RSS feeds list...</td>
                  </tr>
                ) : rssSources.length > 0 ? (
                  rssSources.map((src) => (
                    <tr key={src.id} className="hover:bg-card-hover transition-colors">
                      <td className="p-3 font-bold text-foreground">{src.name}</td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded border border-border bg-card font-semibold text-[10px]">
                          {src.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono truncate max-w-[260px]" title={src.url}>{src.url}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteSource(src.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors focus:outline-none"
                          title="Delete source"
                          aria-label={`Delete ${src.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center italic text-muted">No RSS feeds configured. Add one above!</td>
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

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <span className="text-sm font-medium animate-pulse">Brewing FilterCoffee...</span>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
