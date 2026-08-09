import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ImageUpload } from '../../ui/ImageUpload';
import { Combobox } from '../../ui/Combobox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory } from '../../../lib/api/categories';
import { Category } from '../../../types/category';

const categorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
  sort_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
  featured: z.boolean().default(false),
  homepage_status: z.boolean().default(false),
  navigation_status: z.boolean().default(true),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  category: Category | null;
  categories: Category[];
  onClose: () => void;
  defaultParentId?: string;
}

export function CategoryFormModal({ category, categories, onClose, defaultParentId }: CategoryFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!category;
  
  const [imageUrl, setImageUrl] = useState<string>(category?.image_url || '');
  

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue, control } = useForm<any>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      parent_id: category?.parent_id || defaultParentId || '',
      sort_order: category?.sort_order || 0,
      is_active: category?.is_active ?? true,
      featured: category?.featured || false,
      homepage_status: category?.homepage_status || false,
      navigation_status: category?.navigation_status || true,
      seo_title: category?.seo_title || '',
      seo_description: category?.seo_description || '',
      seo_keywords: category?.seo_keywords || '',
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
    mutationFn: async (data: CategoryFormData) => {
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parent_id: data.parent_id || null, // Convert empty string to null
        sort_order: data.sort_order,
        is_active: data.is_active,
        image_url: imageUrl,
      };
      
      if (isEditing) {
        return updateCategory(category.id, payload);
      } else {
        return createCategory(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Category ${isEditing ? 'updated' : 'created'} successfully`);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save category');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#FFFDF8] rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#E8DCC9]">
          <h2 className="text-xl font-bold text-[#3A2418]">{isEditing ? 'Edit Category' : 'Create Category'}</h2>
          <button onClick={onClose} className="p-2 text-[#8B857D] hover:text-[#5F5A54] hover:bg-[#E8DCC9] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#3A2418] border-b border-[#E8DCC9] pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Name *</label>
                  <Input {...register('name')} placeholder="Category Name" />
                  {errors.name && <p className="text-xs text-[#B94A48] mt-1">{errors.name.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Slug *</label>
                  <Input {...register('slug')} placeholder="category-slug" />
                  {errors.slug && <p className="text-xs text-[#B94A48] mt-1">{errors.slug.message as string}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#5F5A54] mb-1">Description</label>
                <textarea 
                  {...register('description')} 
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E8DCC9] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                  placeholder="Category description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Parent Category</label>
                  <Controller
                    control={control}
                    name="parent_id"
                    render={({ field }) => (
                      <Combobox
                        options={[
                          { label: "None (Top Level)", value: "" },
                          ...categories
                            .filter(c => c.id !== category?.id)
                            .map(c => ({ label: c.name, value: c.id }))
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select parent category..."
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5F5A54] mb-1">Sort Order</label>
                  <Input type="number" {...register('sort_order')} />
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#3A2418] border-b border-[#E8DCC9] pb-2">Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
<label className="block text-sm font-medium text-[#5F5A54] mb-1">Category Image</label>
<ImageUpload value={imageUrl} onChange={setImageUrl} folder="categories" />
</div>
</div>
</div>

            {/* Display & Status */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#3A2418] border-b border-[#E8DCC9] pb-2">Visibility & Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input type="checkbox" {...register('is_active')} className="rounded border-[#E8DCC9] text-primary focus:ring-primary/20" />
                    <span className="text-sm font-medium text-[#5F5A54]">Active</span>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <label className="flex items-center gap-2 p-3 border border-[#E8DCC9] rounded-lg cursor-pointer hover:bg-[#FAF5EC]">
                  <input type="checkbox" {...register('featured')} className="rounded border-slate-300 text-primary focus:ring-primary text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                  <span className="text-sm font-medium text-[#5F5A54]">Featured</span>
                </label>
                <label className="flex items-center gap-2 p-3 border border-[#E8DCC9] rounded-lg cursor-pointer hover:bg-[#FAF5EC]">
                  <input type="checkbox" {...register('homepage_status')} className="rounded border-slate-300 text-primary focus:ring-primary text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                  <span className="text-sm font-medium text-[#5F5A54]">Show on Homepage</span>
                </label>
                <label className="flex items-center gap-2 p-3 border border-[#E8DCC9] rounded-lg cursor-pointer hover:bg-[#FAF5EC]">
                  <input type="checkbox" {...register('navigation_status')} className="rounded border-slate-300 text-primary focus:ring-primary text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" />
                  <span className="text-sm font-medium text-[#5F5A54]">Show in Navigation</span>
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
          <Button type="submit" form="category-form" disabled={isSubmitting || mutation.isPending}>
            {(isSubmitting || mutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
