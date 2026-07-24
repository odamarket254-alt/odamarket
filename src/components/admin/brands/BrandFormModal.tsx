import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ImageUpload } from '../../ui/ImageUpload';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBrand, updateBrand } from '../../../lib/api/brands';
import { Brand } from '../../../types/brand';

const brandSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  status: z.enum(['active', 'draft', 'archived', 'hidden']),
  featured: z.boolean().default(false),
  homepage_status: z.boolean().default(false),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
});

type BrandFormData = z.infer<typeof brandSchema>;

interface BrandFormModalProps {
  brand: Brand | null;
  onClose: () => void;
}

export function BrandFormModal({ brand, onClose }: BrandFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!brand;
  
  const [logoUrl, setLogoUrl] = useState<string>(brand?.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState<string>(brand?.banner_url || '');

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<any>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name || '',
      slug: brand?.slug || '',
      description: brand?.description || '',
      country: brand?.country || '',
      website: brand?.website || '',
      status: brand?.status || 'active',
      featured: brand?.featured || false,
      homepage_status: brand?.homepage_status || false,
      seo_title: brand?.seo_title || '',
      seo_description: brand?.seo_description || '',
      seo_keywords: brand?.seo_keywords || '',
    }
  });

  // Auto-generate slug from name if not editing
  const watchName = watch('name');
  useEffect(() => {
    if (!isEditing && watchName) {
      const generatedSlug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug);
    }
  }, [watchName, isEditing, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: BrandFormData) => {
      const payload = {
        ...data,
        logo_url: logoUrl,
        banner_url: bannerUrl,
      };
      
      if (isEditing) {
        return updateBrand(brand.id, payload);
      } else {
        return createBrand(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success(`Brand ${isEditing ? 'updated' : 'created'} successfully`);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save brand');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#FFFDF8] rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#E8DCC9]">
          <h2 className="text-xl font-bold text-[#3A2418]">{isEditing ? 'Edit Brand' : 'Create Brand'}</h2>
          <button onClick={onClose} className="p-2 text-[#8B857D] hover:text-[#5F5A54] hover:bg-[#E8DCC9] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="brand-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#3A2418] border-b border-[#E8DCC9] pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Name *</label>
                  <Input {...register('name')} placeholder="Brand Name" />
                  {errors.name && <p className="text-xs text-[#B94A48] mt-1">{errors.name.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Slug *</label>
                  <Input {...register('slug')} placeholder="brand-slug" />
                  {errors.slug && <p className="text-xs text-[#B94A48] mt-1">{errors.slug.message as string}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#5F5A54] mb-1">Description</label>
                <textarea 
                  {...register('description')} 
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E8DCC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  placeholder="Brand description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Country of Origin</label>
                  <Input {...register('country')} placeholder="e.g. USA, Italy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Website</label>
                  <Input {...register('website')} placeholder="https://..." />
                  {errors.website && <p className="text-xs text-[#B94A48] mt-1">{errors.website.message as string}</p>}
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#3A2418] border-b border-[#E8DCC9] pb-2">Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Brand Logo</label>
                  <ImageUpload value={logoUrl} onChange={setLogoUrl} folder="brands/logos" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Brand Banner</label>
                  <ImageUpload value={bannerUrl} onChange={setBannerUrl} folder="brands/banners" />
                </div>
              </div>
            </div>

            {/* Display & Status */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#3A2418] border-b border-[#E8DCC9] pb-2">Visibility & Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Status</label>
                  <select 
                    {...register('status')} 
                    className="w-full px-3 py-2 border border-[#E8DCC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-[#FFFDF8] text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2 p-3 border border-[#E8DCC9] rounded-lg cursor-pointer hover:bg-[#FAF5EC]">
                  <input type="checkbox" {...register('featured')} className="rounded border-slate-300 text-primary focus:ring-primary text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                  <span className="text-sm font-medium text-[#5F5A54]">Featured</span>
                </label>
                <label className="flex items-center gap-2 p-3 border border-[#E8DCC9] rounded-lg cursor-pointer hover:bg-[#FAF5EC]">
                  <input type="checkbox" {...register('homepage_status')} className="rounded border-slate-300 text-primary focus:ring-primary text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                  <span className="text-sm font-medium text-[#5F5A54]">Show on Homepage</span>
                </label>
              </div>
            </div>

            {/* SEO */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#3A2418] border-b border-[#E8DCC9] pb-2">Search Engine Optimization</h3>
              <div>
                <label className="block text-sm font-medium text-[#5F5A54] mb-1">SEO Title</label>
                <Input {...register('seo_title')} placeholder="Meta title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5F5A54] mb-1">SEO Keywords</label>
                <Input {...register('seo_keywords')} placeholder="Comma separated keywords" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5F5A54] mb-1">SEO Description</label>
                <textarea 
                  {...register('seo_description')} 
                  rows={2}
                  className="w-full px-3 py-2 border border-[#E8DCC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  placeholder="Meta description"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-[#E8DCC9] flex justify-end gap-3 bg-[#FAF5EC]/50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" form="brand-form" disabled={isSubmitting || mutation.isPending}>
            {(isSubmitting || mutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Brand'}
          </Button>
        </div>
      </div>
    </div>
  );
}
