import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings, Lock, Activity, HelpCircle, LogOut, ChevronDown 
} from 'lucide-react';

interface UserMenuProps {
  user: any;
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[#E8DCC9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20"
      >
        <div className="w-9 h-9 rounded-full bg-[#C65A28] flex items-center justify-center text-white font-bold shrink-0">
          {user?.user_metadata?.full_name?.charAt(0) || 'A'}
        </div>
        <div className="hidden md:flex flex-col items-start mr-1">
          <span className="text-sm font-semibold text-[#3A2418] leading-none mb-1">
            {user?.user_metadata?.full_name || 'Admin User'}
          </span>
          <span className="text-xs text-[#5F5A54] leading-none capitalize">
            {user?.user_metadata?.role || 'Administrator'}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#8B857D] hidden md:block" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-56 bg-[#FFFDF8] rounded-xl shadow-lg border border-[#E8DCC9] py-2 z-50"
            >
              <div className="px-4 py-2 border-b border-[#E8DCC9] md:hidden">
                <p className="text-sm font-semibold text-[#3A2418]">{user?.user_metadata?.full_name}</p>
                <p className="text-xs text-[#5F5A54]">{user?.email}</p>
              </div>

              <div className="py-1">
                <Link to="/admin/dashboard/settings?tab=profile" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#5F5A54] hover:text-[#C65A28] hover:bg-[#F3F6F4] transition-colors">
                  <User className="w-4 h-4" /> My Profile
                </Link>
                <Link to="/admin/dashboard/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#5F5A54] hover:text-[#C65A28] hover:bg-[#F3F6F4] transition-colors">
                  <Settings className="w-4 h-4" /> Account Settings
                </Link>
                <Link to="/admin/dashboard/settings?tab=security" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#5F5A54] hover:text-[#C65A28] hover:bg-[#F3F6F4] transition-colors">
                  <Lock className="w-4 h-4" /> Change Password
                </Link>
                <Link to="/admin/dashboard/audit" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#5F5A54] hover:text-[#C65A28] hover:bg-[#F3F6F4] transition-colors">
                  <Activity className="w-4 h-4" /> Activity Log
                </Link>
              </div>

              <div className="border-t border-[#E8DCC9] py-1">
                <Link to="/admin/dashboard/support" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#5F5A54] hover:text-[#C65A28] hover:bg-[#F3F6F4] transition-colors">
                  <HelpCircle className="w-4 h-4" /> Help & Support
                </Link>
              </div>

              <div className="border-t border-[#E8DCC9] py-1">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#B94A48] hover:bg-[#B94A48]/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
