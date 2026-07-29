import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader2, Save } from 'lucide-react';

// Wait I will use react-hook-form and zod
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

const schema = z.object({
  status: z.enum(['published', 'draft', 'hidden', 'scheduled']),
  content: z.object({
    text: z.string().min(1, 'Text is required'),
    bgColor: z.string().min(1, 'Background color is required'),
    textColor: z.string().min(1, 'Text color is required'),
  })
});

type FormData = z.infer<typeof schema>;

export function AnnouncementBarManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useRHForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'draft',
      content: {
        text: 'Welcome to OdaMarket! Enjoy free shipping on orders over KSh 5000.',
        bgColor: '#C65A28',
        textColor: '#ffffff'
      }
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value').limit(100)
        .eq('key', 'storefront_announcementbarmanager')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.value) {
        reset(data.value);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const { error: upsertError } = await supabase
        .from('settings')
        .upsert({
          key: 'storefront_announcementbarmanager',
          value: data,
          group_name: 'storefront'
        });

      if (upsertError) throw upsertError;
      toast.success('Announcement Bar updated successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
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
          <h3 className="text-xl font-bold text-[#3A2418]">Announcement Bar</h3>
          <p className="text-sm text-[#5F5A54]">Manage the top announcement bar text and style</p>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-[#C65A28] hover:bg-[#C65A28] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-[#FAF5EC] border border-[#E8DCC9] rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#5F5A54] mb-1">Status</label>
          <select 
            {...register('status')}
            className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
            <option value="scheduled">Scheduled</option>
          </select>
          {errors.status && <p className="text-[#B94A48] text-sm mt-1">{errors.status.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#5F5A54] mb-1">Text content</label>
          <input
            {...register('content.text')}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
          />
          {errors.content?.text && <p className="text-[#B94A48] text-sm mt-1">{errors.content.text.message}</p>}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#5F5A54] mb-1">Background Color</label>
            <input
              type="color"
              {...register('content.bgColor')}
              className="w-full h-12 rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none cursor-pointer text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-[#5F5A54] mb-1">Text Color</label>
            <input
              type="color"
              {...register('content.textColor')}
              className="w-full h-12 rounded-xl border border-[#E8DCC9] focus:border-[#C65A28] outline-none cursor-pointer text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
