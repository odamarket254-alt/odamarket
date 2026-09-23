import React, { useState } from 'react';
import { Users, MailWarning, UserCheck } from 'lucide-react';
import UnconfirmedUsersWidget from '../../components/admin/dashboard/UnconfirmedUsersWidget';
import AllUsersTable from '../../components/admin/dashboard/AllUsersTable';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'unconfirmed'>('directory');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2418] tracking-tight">Customers & Users</h1>
          <p className="text-sm text-[#5F5A54] mt-1">
            Manage your customer database, deactivate users safely with Soft Delete, and monitor unconfirmed registrations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-[#FAF5EC] border border-[#E8DCC9] rounded-xl self-start">
          <button
            id="tab-all-users"
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-[#C65A28] text-white shadow-xs'
                : 'text-[#5F5A54] hover:text-[#3A2418]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Users & Soft Delete</span>
          </button>

          <button
            id="tab-unconfirmed-users"
            onClick={() => setActiveTab('unconfirmed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'unconfirmed'
                ? 'bg-[#C65A28] text-white shadow-xs'
                : 'text-[#5F5A54] hover:text-[#3A2418]'
            }`}
          >
            <MailWarning className="w-3.5 h-3.5" />
            <span>Unconfirmed Diagnostic</span>
          </button>
        </div>
      </div>

      {activeTab === 'directory' ? (
        <AllUsersTable />
      ) : (
        <UnconfirmedUsersWidget />
      )}
    </div>
  );
}
