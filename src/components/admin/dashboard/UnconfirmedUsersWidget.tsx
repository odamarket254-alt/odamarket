import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  MailWarning, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Copy, 
  Send, 
  ExternalLink, 
  Download, 
  ShieldCheck, 
  Check,
  ChevronDown,
  Globe
} from 'lucide-react';

export interface UnconfirmedUser {
  id: string;
  email: string;
  domain: string;
  timeSegment: 'under24h' | 'from1to7d' | 'over7d';
  hoursAgo: number;
  daysAgo: number;
  createdAt: string;
  lastSignInAt?: string;
  provider: string;
  role: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatarUrl: string;
}

export interface UnconfirmedMetrics {
  totalRegistered: number;
  totalUnconfirmed: number;
  unconfirmedPercentage: number;
  segments: {
    under24h: number;
    from1to7d: number;
    over7d: number;
    domains: Record<string, number>;
    roles: Record<string, number>;
  };
}

export default function UnconfirmedUsersWidget() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<UnconfirmedMetrics | null>(null);
  const [users, setUsers] = useState<UnconfirmedUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'under24h' | 'from1to7d' | 'over7d'>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUnconfirmedUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/admin/unconfirmed-users');
      if (!res.ok) {
        throw new Error(`Failed to load unconfirmed users (HTTP ${res.status})`);
      }
      const data = await res.json();
      setMetrics(data.metrics);
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching unconfirmed users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUnconfirmedUsers();
  }, []);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Search
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch = !search || 
        u.email.toLowerCase().includes(search) ||
        u.firstName.toLowerCase().includes(search) ||
        u.lastName.toLowerCase().includes(search) ||
        u.phoneNumber.toLowerCase().includes(search);

      // Segment
      const matchesSegment = selectedSegment === 'all' || u.timeSegment === selectedSegment;

      // Domain
      const matchesDomain = selectedDomain === 'all' || u.domain.toLowerCase() === selectedDomain.toLowerCase();

      // Role
      const matchesRole = selectedRole === 'all' || u.role.toLowerCase() === selectedRole.toLowerCase();

      return matchesSearch && matchesSegment && matchesDomain && matchesRole;
    });
  }, [users, searchQuery, selectedSegment, selectedDomain, selectedRole]);

  // Unique domains list for filtering
  const availableDomains = useMemo(() => {
    if (!metrics?.segments?.domains) return [];
    return Object.entries(metrics.segments.domains)
      .sort((a, b) => b[1] - a[1]);
  }, [metrics]);

  // Manual Confirmation Handler
  const handleConfirmUser = async (user: UnconfirmedUser) => {
    if (!confirm(`Are you sure you want to manually verify email confirmation for ${user.email}?`)) {
      return;
    }

    setProcessingId(user.id);
    setActionNotice(null);

    try {
      const res = await fetch('/api/auth/admin/confirm-user-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to confirm email');
      }

      setActionNotice({
        type: 'success',
        message: `Successfully verified email for ${user.email}`
      });

      // Remove from unconfirmed list locally
      setUsers(prev => prev.filter(u => u.id !== user.id));
      if (metrics) {
        setMetrics({
          ...metrics,
          totalUnconfirmed: Math.max(0, metrics.totalUnconfirmed - 1)
        });
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to confirm user'
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Generate & Copy Link Handler
  const handleCopyLink = async (user: UnconfirmedUser) => {
    setProcessingId(user.id);
    try {
      const res = await fetch('/api/auth/admin/generate-verification-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();

      if (data.actionLink) {
        await navigator.clipboard.writeText(data.actionLink);
        setCopiedId(user.id);
        setActionNotice({
          type: 'success',
          message: `Verification link copied to clipboard for ${user.email}`
        });
        setTimeout(() => setCopiedId(null), 3000);
      } else {
        throw new Error('No action link generated');
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: `Could not generate link: ${err.message}`
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Resend Email Handler
  const handleResendEmail = async (user: UnconfirmedUser) => {
    setProcessingId(user.id);
    setActionNotice(null);

    try {
      const res = await fetch('/api/auth/admin/resend-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          firstName: user.firstName || 'Customer' 
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend email');
      }

      setActionNotice({
        type: 'success',
        message: data.message || `Verification email dispatched to ${user.email}`
      });
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Failed to dispatch verification email'
      });
    } finally {
      setProcessingId(null);
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;

    const headers = ['Email', 'First Name', 'Last Name', 'Role', 'Domain', 'Registered At', 'Time Unconfirmed (Days)', 'Phone'];
    const rows = filteredUsers.map(u => [
      u.email,
      u.firstName || '',
      u.lastName || '',
      u.role || '',
      u.domain || '',
      new Date(u.createdAt).toISOString(),
      u.daysAgo.toString(),
      u.phoneNumber || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(item => `"${(item || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `unconfirmed_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="unconfirmed-users-diagnostic-widget" className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Widget Header */}
      <div className="p-5 border-b border-[#E8DCC9] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#FFFDF8] to-[#FAF5EC]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#C65A28] border border-[#E8DCC9] flex items-center justify-center shrink-0 shadow-xs">
            <MailWarning className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#3A2418] text-base">Unconfirmed Email Registrations</h3>
              {metrics && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {metrics.totalUnconfirmed} pending ({metrics.unconfirmedPercentage}% of signups)
                </span>
              )}
            </div>
            <p className="text-xs text-[#5F5A54] mt-0.5">
              Users who registered with email_confirmed_at null. Useful for diagnosing SMTP drop-offs or unreceived verification emails.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            id="btn-export-unconfirmed-csv"
            onClick={handleExportCSV}
            disabled={filteredUsers.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFDF8] border border-[#E8DCC9] text-[#5F5A54] hover:text-[#3A2418] hover:bg-[#FAF5EC] rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
            title="Export filtered list to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            id="btn-refresh-unconfirmed-users"
            onClick={() => fetchUnconfirmedUsers(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C65A28] hover:bg-[#B34E20] text-white rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className={`px-5 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-xs underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Breakdown Cards */}
      {metrics && (
        <div className="p-5 border-b border-[#E8DCC9] bg-[#FAF5EC]/50 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedSegment(selectedSegment === 'all' ? 'all' : 'all')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedSegment === 'all' 
                ? 'bg-white border-[#C65A28] shadow-xs' 
                : 'bg-white/60 border-[#E8DCC9] hover:bg-white'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8B857D] block">All Unconfirmed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#3A2418]">{metrics.totalUnconfirmed}</span>
              <span className="text-xs text-[#8B857D]">/ {metrics.totalRegistered} users</span>
            </div>
            <span className="text-[11px] text-[#5F5A54] block mt-0.5">{metrics.unconfirmedPercentage}% drop-off rate</span>
          </button>

          <button
            onClick={() => setSelectedSegment(selectedSegment === 'under24h' ? 'all' : 'under24h')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedSegment === 'under24h' 
                ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500/20' 
                : 'bg-white/60 border-[#E8DCC9] hover:bg-white'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-700 block flex items-center gap-1">
              <Clock className="w-3 h-3" /> Recent (&lt; 24h)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#3A2418]">{metrics.segments.under24h}</span>
              <span className="text-xs text-blue-600 font-medium">New signups</span>
            </div>
            <span className="text-[11px] text-[#8B857D] block mt-0.5">Likely in inbox or spam folder</span>
          </button>

          <button
            onClick={() => setSelectedSegment(selectedSegment === 'from1to7d' ? 'all' : 'from1to7d')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedSegment === 'from1to7d' 
                ? 'bg-white border-amber-500 shadow-xs ring-1 ring-amber-500/20' 
                : 'bg-white/60 border-[#E8DCC9] hover:bg-white'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-700 block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> At Risk (1 - 7d)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#3A2418]">{metrics.segments.from1to7d}</span>
              <span className="text-xs text-amber-700 font-medium">Need outreach</span>
            </div>
            <span className="text-[11px] text-[#8B857D] block mt-0.5">Suspected SMTP delivery block</span>
          </button>

          <button
            onClick={() => setSelectedSegment(selectedSegment === 'over7d' ? 'all' : 'over7d')}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedSegment === 'over7d' 
                ? 'bg-white border-stone-500 shadow-xs ring-1 ring-stone-500/20' 
                : 'bg-white/60 border-[#E8DCC9] hover:bg-white'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-600 block flex items-center gap-1">
              <Clock className="w-3 h-3" /> Stale (&gt; 7d)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#3A2418]">{metrics.segments.over7d}</span>
              <span className="text-xs text-stone-600 font-medium">Dormant</span>
            </div>
            <span className="text-[11px] text-[#8B857D] block mt-0.5">Abandoned or typo emails</span>
          </button>
        </div>
      )}

      {/* Domain Problem Segmentation Pill Bar */}
      {availableDomains.length > 0 && (
        <div className="px-5 py-2.5 border-b border-[#E8DCC9] bg-[#FFFDF8] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[#8B857D] font-medium shrink-0 flex items-center gap-1">
            <Globe className="w-3 h-3 text-[#C65A28]" />
            Provider Segment:
          </span>
          <button
            onClick={() => setSelectedDomain('all')}
            className={`px-2.5 py-1 rounded-md transition font-medium shrink-0 ${
              selectedDomain === 'all'
                ? 'bg-[#3A2418] text-white'
                : 'bg-[#FAF5EC] text-[#5F5A54] hover:bg-[#F2E8DA]'
            }`}
          >
            All Domains ({users.length})
          </button>
          {availableDomains.map(([domain, count]) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(selectedDomain === domain ? 'all' : domain)}
              className={`px-2.5 py-1 rounded-md transition font-medium shrink-0 flex items-center gap-1.5 ${
                selectedDomain === domain
                  ? 'bg-[#C65A28] text-white shadow-2xs'
                  : 'bg-[#FAF5EC] text-[#5F5A54] hover:bg-[#F2E8DA] border border-[#E8DCC9]/60'
              }`}
            >
              <span>@{domain}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedDomain === domain ? 'bg-white/20 text-white' : 'bg-[#E8DCC9] text-[#3A2418]'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="p-4 border-b border-[#E8DCC9] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8B857D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-unconfirmed-users"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email, name, or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF5EC] border border-[#E8DCC9] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C65A28] text-[#3A2418]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          {/* Role Filter */}
          <select
            id="select-unconfirmed-role-filter"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FAF5EC] border border-[#E8DCC9] rounded-lg text-[#5F5A54] text-xs focus:outline-none focus:ring-1 focus:ring-[#C65A28]"
          >
            <option value="all">All User Roles</option>
            <option value="customer">Customer / Buyer</option>
            <option value="seller">Seller / Vendor</option>
            <option value="wholesale">Wholesale / Supplier</option>
            <option value="admin">Admin / Staff</option>
          </select>

          {/* Segment Filter */}
          <select
            id="select-unconfirmed-time-segment"
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value as any)}
            className="px-2.5 py-1.5 bg-[#FAF5EC] border border-[#E8DCC9] rounded-lg text-[#5F5A54] text-xs focus:outline-none focus:ring-1 focus:ring-[#C65A28]"
          >
            <option value="all">All Timeframes</option>
            <option value="under24h">&lt; 24h (Recent)</option>
            <option value="from1to7d">1 - 7 Days (At Risk)</option>
            <option value="over7d">&gt; 7 Days (Stale)</option>
          </select>

          <span className="text-[11px] text-[#8B857D] whitespace-nowrap">
            Showing {filteredUsers.length} of {users.length}
          </span>
        </div>
      </div>

      {/* Users Table / List */}
      <div className="overflow-x-auto min-h-[260px] flex-1">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-[#8B857D] gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#C65A28]" />
            <span className="text-xs">Loading unconfirmed accounts diagnostic data...</span>
          </div>
        ) : error ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-8 h-8 text-rose-600 mb-2" />
            <p className="text-sm font-semibold text-rose-700">Error loading unconfirmed users</p>
            <p className="text-xs text-[#5F5A54] max-w-sm mt-1 mb-3">{error}</p>
            <button
              onClick={() => fetchUnconfirmedUsers()}
              className="px-3 py-1.5 bg-[#C65A28] text-white rounded-lg text-xs font-medium"
            >
              Retry
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-[#3A2418]">No Unconfirmed Users Found</h4>
            <p className="text-xs text-[#5F5A54] max-w-xs mt-1">
              {users.length === 0
                ? 'All registered users in Supabase Auth have verified email addresses!'
                : 'No unconfirmed users match your active search and filter criteria.'}
            </p>
            {users.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSegment('all');
                  setSelectedDomain('all');
                  setSelectedRole('all');
                }}
                className="mt-3 text-xs text-[#C65A28] hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E8DCC9] bg-[#FAF5EC]/40 text-[#8B857D] uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Segment / Staleness</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4 text-right">Quick Diagnostic Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC9]">
              {filteredUsers.map((u) => {
                const isProcessing = processingId === u.id;
                const isCopied = copiedId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-[#FAF5EC]/50 transition-colors">
                    {/* User Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FAF5EC] border border-[#E8DCC9] flex items-center justify-center text-[#C65A28] font-bold text-xs shrink-0">
                          {u.firstName ? u.firstName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#3A2418] flex items-center gap-1.5">
                            <span>{u.email}</span>
                          </div>
                          <div className="text-[11px] text-[#8B857D] flex items-center gap-2 mt-0.5">
                            {u.firstName || u.lastName ? (
                              <span>{[u.firstName, u.lastName].filter(Boolean).join(' ')}</span>
                            ) : (
                              <span className="italic">No name in profile</span>
                            )}
                            {u.phoneNumber && (
                              <>
                                <span>•</span>
                                <span>{u.phoneNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Age / Staleness Segment */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.timeSegment === 'under24h'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : u.timeSegment === 'from1to7d'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}>
                          <Clock className="w-2.5 h-2.5" />
                          {u.timeSegment === 'under24h'
                            ? `${u.hoursAgo}h ago`
                            : `${u.daysAgo} days ago`}
                        </span>
                        <div className="text-[10px] text-[#8B857D]">
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-[#FAF5EC] border border-[#E8DCC9] text-[#5F5A54] font-medium text-[11px]">
                        {u.role}
                      </span>
                    </td>

                    {/* Domain */}
                    <td className="py-3 px-4">
                      <span className="text-[#3A2418] font-mono text-[11px]">
                        @{u.domain}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Generate & Copy Link */}
                        <button
                          id={`btn-copy-link-${u.id}`}
                          onClick={() => handleCopyLink(u)}
                          disabled={isProcessing}
                          title="Generate verification action link and copy to clipboard"
                          className={`p-1.5 rounded-md border text-xs font-medium transition flex items-center gap-1 ${
                            isCopied 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-[#FFFDF8] border-[#E8DCC9] text-[#5F5A54] hover:bg-[#FAF5EC] hover:text-[#3A2418]'
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="hidden xl:inline">{isCopied ? 'Copied' : 'Link'}</span>
                        </button>

                        {/* 2. Resend Email */}
                        <button
                          id={`btn-resend-email-${u.id}`}
                          onClick={() => handleResendEmail(u)}
                          disabled={isProcessing}
                          title="Dispatch branded verification email via Resend"
                          className="p-1.5 rounded-md border border-[#E8DCC9] bg-[#FFFDF8] text-[#5F5A54] hover:bg-[#FAF5EC] hover:text-[#C65A28] transition flex items-center gap-1 text-xs font-medium"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Resend</span>
                        </button>

                        {/* 3. Manual Confirm Email */}
                        <button
                          id={`btn-confirm-email-${u.id}`}
                          onClick={() => handleConfirmUser(u)}
                          disabled={isProcessing}
                          title="Manually verify email_confirmed_at for this user"
                          className="px-2.5 py-1 rounded-md bg-[#C65A28] hover:bg-[#B34E20] text-white text-xs font-medium transition flex items-center gap-1 shadow-2xs disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#E8DCC9] bg-[#FAF5EC]/30 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8B857D] gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C65A28]" />
          <span>
            Actions directly update Supabase Auth <code className="bg-[#E8DCC9]/40 px-1 py-0.5 rounded text-[#3A2418]">auth.users</code> via service role.
          </span>
        </div>
        <div>
          <span>Tip: Use <strong>Link</strong> to bypass SMTP blocks and send directly to customer on WhatsApp or SMS.</span>
        </div>
      </div>
    </div>
  );
}
