import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader2, Save } from 'lucide-react';

export function NavigationManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value').limit(100)
        .eq('key', 'storefront_navigationmanager')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data.value || {});
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error: upsertError } = await supabase
        .from('settings')
        .upsert({
          key: 'storefront_navigationmanager',
          value: settings
        });

      if (upsertError) throw upsertError;
      alert('Navigation updated successfully.');
    } catch (error: any) {
      alert(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C65A28]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#3A2418]">Navigation</h3>
          <p className="text-sm text-[#5F5A54]">Manage top navigation menu and logo</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>
      
      <div className="bg-[#FAF5EC] border border-[#E8DCC9] rounded-2xl p-6">
        <p className="text-sm text-[#5F5A54] mb-4">Settings for Navigation</p>
        {/* Placeholder form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5F5A54] mb-1">Status</label>
            <select 
              value={settings.status || 'draft'}
              onChange={(e) => setSettings({...settings, status: e.target.value})}
              className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#5F5A54] mb-1">Content (JSON config)</label>
            <textarea
              value={JSON.stringify(settings.content || {}, null, 2)}
              onChange={(e) => {
                try {
                  const content = JSON.parse(e.target.value);
                  setSettings({...settings, content});
                } catch(err) {
                  // ignore parse error while typing
                }
              }}
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8DCC9] font-mono text-sm focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
