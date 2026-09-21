import React from 'react';
import { Users, Search, Download } from 'lucide-react';
import UnconfirmedUsersWidget from '../../components/admin/dashboard/UnconfirmedUsersWidget';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2418] tracking-tight">Customers & Users</h1>
          <p className="text-sm text-[#5F5A54] mt-1">Manage your customer database, account verification, and problematic registration segments.</p>
        </div>
      </div>

      {/* Unconfirmed Email Registrations Diagnostic Widget */}
      <UnconfirmedUsersWidget />
    </div>
  );
}
