import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserX, 
  UserCheck, 
  RotateCcw, 
  Trash2, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Shield, 
  Clock, 
  Download,
  AlertCircle
} from 'lucide-react';

export interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  isConfirmed: boolean;
  emailConfirmedAt?: string | null;
  isSoftDeleted: boolean;
  bannedUntil?: string;
  deletedAt?: string | null;
  createdAt: string;
  lastSignInAt?: string | null;
}

interface UserCounts {
  total: number;
  active: number;
  unconfirmed: number;
  softDeleted: number;
}

export default function AllUsersTable() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [counts, setCounts] = useState<UserCounts>({ total: 0, active: 0, unconfirmed: 0, softDeleted: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unconfirmed' | 'softDeleted'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Action status
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/admin/all-users');
      if (!res.ok) {
        throw new Error(`Failed to load users (HTTP ${res.status})`);
      }
      const data = await res.json();
      setUsers(data.users || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching users list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        u.email.toLowerCase().includes(query) ||
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        u.phoneNumber.toLowerCase().includes(query);

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'softDeleted' && u.isSoftDeleted) ||
        (statusFilter === 'active' && !u.isSoftDeleted && u.isConfirmed) ||
        (statusFilter === 'unconfirmed' && !u.isSoftDeleted && !u.isConfirmed);

      const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  // Soft Delete Handler
  const handleSoftDelete = async (user: UserRecord) => {
    const confirmMessage = `Soft delete user "${user.email}"?\n\n• Account will be safely deactivated & banned from logging in.\n• Database order records, addresses, and tickets remain intact.\n• No foreign key constraint errors will occur.\n• You can restore this user anytime.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setProcessingId(user.id);
    setActionNotice(null);

    try {
      const res = await fetch('/api/auth/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, softDelete: true })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to soft delete user');
      }

      setActionNotice({
        type: 'success',
        message: data.message || `User ${user.email} soft-deleted successfully.`
      });

      // Update locally
      setUsers(prev => prev.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            isSoftDeleted: true,
            deletedAt: new Date().toISOString()
          };
        }
        return u;
      }));

      setCounts(prev => ({
        ...prev,
        softDeleted: prev.softDeleted + 1,
        active: user.isConfirmed ? Math.max(0, prev.active - 1) : prev.active,
        unconfirmed: !user.isConfirmed ? Math.max(0, prev.unconfirmed - 1) : prev.unconfirmed
      }));
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Error soft-deleting user'
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Restore Handler
  const handleRestoreUser = async (user: UserRecord) => {
    if (!window.confirm(`Restore and reactivate user "${user.email}"? Access will be reinstated.`)) {
      return;
    }

    setProcessingId(user.id);
    setActionNotice(null);

    try {
      const res = await fetch('/api/auth/admin/restore-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to restore user');
      }

      setActionNotice({
        type: 'success',
        message: data.message || `User ${user.email} restored successfully.`
      });

      // Update locally
      setUsers(prev => prev.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            isSoftDeleted: false,
            deletedAt: null
          };
        }
        return u;
      }));

      setCounts(prev => ({
        ...prev,
        softDeleted: Math.max(0, prev.softDeleted - 1),
        active: user.isConfirmed ? prev.active + 1 : prev.active,
        unconfirmed: !user.isConfirmed ? prev.unconfirmed + 1 : prev.unconfirmed
      }));
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Error restoring user'
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ['Email', 'First Name', 'Last Name', 'Role', 'Status', 'Email Confirmed', 'Soft Deleted', 'Created At'];
    const rows = filteredUsers.map(u => [
      u.email,
      u.firstName,
      u.lastName,
      u.role,
      u.isSoftDeleted ? 'Soft Deleted' : u.isConfirmed ? 'Active' : 'Unconfirmed',
      u.isConfirmed ? 'Yes' : 'No',
      u.isSoftDeleted ? 'Yes' : 'No',
      new Date(u.createdAt).toISOString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.map(item => `"${(item || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `odamarket-users-${statusFilter}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#FFFDF8] border border-[#E8DCC9] rounded-xl overflow-hidden shadow-xs">
      {/* Header & Title */}
      <div className="p-5 border-b border-[#E8DCC9] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#3A2418]">User Management & Soft Delete</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FAF5EC] text-[#5F5A54] border border-[#E8DCC9]">
              {counts.total} Accounts
            </span>
          </div>
          <p className="text-xs text-[#5F5A54] mt-1">
            Safely deactivate and archive users with <strong>Soft Delete</strong> to preserve orders, transactions, and foreign key integrity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-all-users"
            onClick={handleExportCSV}
            disabled={filteredUsers.length === 0}
            className="px-3 py-1.5 rounded-md border border-[#E8DCC9] bg-[#FFFDF8] text-[#5F5A54] hover:bg-[#FAF5EC] hover:text-[#3A2418] transition flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-refresh-all-users"
            onClick={() => fetchUsers(true)}
            disabled={loading || refreshing}
            className="px-3 py-1.5 rounded-md border border-[#E8DCC9] bg-[#FFFDF8] text-[#5F5A54] hover:bg-[#FAF5EC] hover:text-[#3A2418] transition flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-[#FAF5EC]/40 border-b border-[#E8DCC9]">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-lg border text-left transition ${
            statusFilter === 'all' 
              ? 'bg-[#FFFDF8] border-[#C65A28] shadow-xs' 
              : 'bg-[#FFFDF8]/70 border-[#E8DCC9] hover:bg-[#FFFDF8]'
          }`}
        >
          <div className="text-xs font-medium text-[#5F5A54]">All Users</div>
          <div className="text-xl font-bold text-[#3A2418] mt-0.5">{counts.total}</div>
        </button>

        <button
          onClick={() => setStatusFilter('active')}
          className={`p-3 rounded-lg border text-left transition ${
            statusFilter === 'active' 
              ? 'bg-[#FFFDF8] border-emerald-500 shadow-xs' 
              : 'bg-[#FFFDF8]/70 border-[#E8DCC9] hover:bg-[#FFFDF8]'
          }`}
        >
          <div className="text-xs font-medium text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Confirmed</span>
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-0.5">{counts.active}</div>
        </button>

        <button
          onClick={() => setStatusFilter('unconfirmed')}
          className={`p-3 rounded-lg border text-left transition ${
            statusFilter === 'unconfirmed' 
              ? 'bg-[#FFFDF8] border-amber-500 shadow-xs' 
              : 'bg-[#FFFDF8]/70 border-[#E8DCC9] hover:bg-[#FFFDF8]'
          }`}
        >
          <div className="text-xs font-medium text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Unconfirmed</span>
          </div>
          <div className="text-xl font-bold text-amber-800 mt-0.5">{counts.unconfirmed}</div>
        </button>

        <button
          onClick={() => setStatusFilter('softDeleted')}
          className={`p-3 rounded-lg border text-left transition ${
            statusFilter === 'softDeleted' 
              ? 'bg-[#FFFDF8] border-rose-500 shadow-xs' 
              : 'bg-[#FFFDF8]/70 border-[#E8DCC9] hover:bg-[#FFFDF8]'
          }`}
        >
          <div className="text-xs font-medium text-rose-700 flex items-center gap-1">
            <UserX className="w-3.5 h-3.5" />
            <span>Soft Deleted</span>
          </div>
          <div className="text-xl font-bold text-rose-800 mt-0.5">{counts.softDeleted}</div>
        </button>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className={`mx-5 mt-4 p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
          actionNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)}
            className="font-bold opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-[#E8DCC9] flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8B857D] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-user-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or phone..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E8DCC9] bg-[#FFFDF8] text-xs text-[#3A2418] placeholder-[#8B857D] focus:outline-none focus:border-[#C65A28]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            id="select-user-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#E8DCC9] bg-[#FFFDF8] text-xs text-[#5F5A54] focus:outline-none focus:border-[#C65A28]"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="seller">Seller / Supplier</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E8DCC9] bg-[#FAF5EC]/60 text-[#5F5A54]">
              <th className="py-2.5 px-4 font-semibold">User & Contact</th>
              <th className="py-2.5 px-4 font-semibold">Role</th>
              <th className="py-2.5 px-4 font-semibold">Account Status</th>
              <th className="py-2.5 px-4 font-semibold">Registered</th>
              <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DCC9]">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#8B857D]">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C65A28]" />
                  <span>Loading user directory...</span>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#8B857D]">
                  <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <span>No users match the selected filters.</span>
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => {
                const isProcessing = processingId === u.id;

                return (
                  <tr 
                    key={u.id}
                    className={`hover:bg-[#FAF5EC]/50 transition ${
                      u.isSoftDeleted ? 'bg-rose-50/30 opacity-75' : ''
                    }`}
                  >
                    {/* User & Contact */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                          u.isSoftDeleted 
                            ? 'bg-rose-100 border-rose-200 text-rose-700' 
                            : 'bg-[#FAF5EC] border-[#E8DCC9] text-[#C65A28]'
                        }`}>
                          {u.firstName ? u.firstName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-semibold ${u.isSoftDeleted ? 'line-through text-[#8B857D]' : 'text-[#3A2418]'}`}>
                            {u.email}
                          </div>
                          <div className="text-[11px] text-[#8B857D] flex items-center gap-2 mt-0.5">
                            {u.firstName || u.lastName ? (
                              <span>{[u.firstName, u.lastName].filter(Boolean).join(' ')}</span>
                            ) : (
                              <span className="italic">No name specified</span>
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

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-[#FAF5EC] border border-[#E8DCC9] text-[#5F5A54] font-medium text-[11px]">
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {u.isSoftDeleted ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            <UserX className="w-2.5 h-2.5" />
                            <span>Soft Deleted</span>
                          </span>
                          {u.deletedAt && (
                            <div className="text-[10px] text-[#8B857D]">
                              {new Date(u.deletedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : u.isConfirmed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Unconfirmed</span>
                        </span>
                      )}
                    </td>

                    {/* Registration Date */}
                    <td className="py-3 px-4 text-[#8B857D] text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.isSoftDeleted ? (
                          /* Restore Button */
                          <button
                            id={`btn-restore-user-${u.id}`}
                            onClick={() => handleRestoreUser(u)}
                            disabled={isProcessing}
                            title="Restore account access and unban user"
                            className="px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                            <span>Restore</span>
                          </button>
                        ) : (
                          /* Soft Delete Button */
                          <button
                            id={`btn-soft-delete-${u.id}`}
                            onClick={() => handleSoftDelete(u)}
                            disabled={isProcessing}
                            title="Soft delete user (safely deactivates account without database errors)"
                            className="px-2.5 py-1 rounded-md border border-rose-200 bg-[#FFFDF8] hover:bg-rose-50 text-rose-700 text-xs font-medium transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <UserX className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                            <span>Soft Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
