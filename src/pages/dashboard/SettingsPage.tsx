import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  User, MapPin, CreditCard, Bell, Globe, 
  Moon, Shield, Key, Trash2 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { profile, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'addresses', label: 'Delivery Addresses', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-64 shrink-0 p-2 border-0 shadow-none bg-transparent md:bg-card md:border md:shadow-sm md:p-4">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </Card>

        <div className="flex-1">
          {activeTab === 'personal' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Personal Information</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                  <input type="text" defaultValue={profile?.first_name || ''} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
                  <input type="email" defaultValue={profile?.email || ''} disabled className="w-full px-4 py-2 border rounded-lg bg-muted text-muted-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Phone Number</label>
                  <input type="tel" defaultValue={profile?.phone || ''} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <Button className="mt-4">Save Changes</Button>
              </div>
            </Card>
          )}

          {activeTab === 'addresses' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Delivery Addresses</h2>
                <Button size="sm">Add New Address</Button>
              </div>
              <div className="p-8 text-center border-2 border-dashed rounded-xl">
                <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">You haven't saved any delivery addresses yet.</p>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6 space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" /> Change Password
                </h2>
                <div className="space-y-4 max-w-md">
                  <input type="password" placeholder="Current Password" className="w-full px-4 py-2 border rounded-lg" />
                  <input type="password" placeholder="New Password" className="w-full px-4 py-2 border rounded-lg" />
                  <input type="password" placeholder="Confirm New Password" className="w-full px-4 py-2 border rounded-lg" />
                  <Button>Update Password</Button>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Danger Zone
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </Card>
          )}

          {/* Placeholders for others */}
          {['payments', 'notifications', 'preferences'].includes(activeTab) && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 capitalize">{activeTab}</h2>
              <p className="text-muted-foreground">This feature is currently under development.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
