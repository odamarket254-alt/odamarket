import React, { useState } from 'react';
import { 
  Settings, User, Lock, CreditCard, Bell, Globe, Database, Shield, Zap, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const sections = [
    { id: "general", label: "General Information", icon: Settings },
    { id: "account", label: "Account Profile", icon: User },
    { id: "security", label: "Security & Passwords", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing & Plans", icon: CreditCard },
    { id: "api", label: "API & Integrations", icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2418] tracking-tight">Settings</h1>
          <p className="text-sm text-[#5F5A54] mt-1">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Settings Sidebar */}
        <div className="md:col-span-3 space-y-1">
          {sections.map(section => {
            const isActive = activeTab === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  isActive 
                    ? 'bg-[#C65A28]/10 text-[#C65A28]' 
                    : 'text-[#5F5A54] hover:bg-[#E8DCC9] hover:text-[#3A2418]'
                }`}
              >
                <section.icon className={`w-4 h-4 ${isActive ? 'text-[#C65A28]' : 'text-[#8B857D]'}`} />
                {section.label}
              </button>
            )
          })}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-9">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-[#E8DCC9]">
               <h2 className="text-lg font-bold text-[#3A2418]">{sections.find(s => s.id === activeTab)?.label}</h2>
               <p className="text-sm text-[#5F5A54] mt-1">Update your {activeTab} preferences and configurations.</p>
            </div>
            
            <div className="p-6 space-y-6">
              {activeTab === "general" && (
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#5F5A54] mb-1">Store Name</label>
                      <input type="text" defaultValue="ODA Market" className="w-full px-4 py-2 bg-[#FFFDF8] border border-[#E8DCC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5F5A54] mb-1">Contact Email</label>
                      <input type="email" defaultValue="admin@odamarket.com" className="w-full px-4 py-2 bg-[#FFFDF8] border border-[#E8DCC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5F5A54] mb-1">Store Currency</label>
                      <select className="w-full px-4 py-2 bg-[#FFFDF8] border border-[#E8DCC9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900">
                        <option>Kenyan Shilling (KSh)</option>
                        <option>Kenyan Shilling (KSh)</option>
                        <option>Euro (€)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-[#E8DCC9]">
                    <button className="px-6 py-2 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-lg font-medium shadow-sm transition-colors text-sm">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab !== "general" && (
                <div className="py-12 flex flex-col items-center justify-center text-[#8B857D]">
                  <Settings className="w-12 h-12 mb-4 opacity-20" />
                  <p>This settings module is currently under development.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
