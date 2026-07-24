import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft, Save, Image as ImageIcon, Plus, Trash2, Check, Loader2,
  ChevronRight, UploadCloud, Info, AlertCircle, LayoutGrid, List, Settings,
  Link as LinkIcon, History, Search, X, Package, Box, MapPin, Tag, CreditCard,
  Globe, AlertTriangle, FileText, Upload
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicCategorySelector } from '../../components/admin/categories/DynamicCategorySelector';
import { Combobox } from '../../components/ui/Combobox';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  short_description: z.string().optional(),
  regular_price: z.coerce.number().min(0, 'Price must be positive'),
  sale_price: z.coerce.number().min(0).optional().nullable(),
  cost_price: z.coerce.number().min(0).optional().nullable(),
  weight: z.coerce.number().min(0).optional().nullable(),
  unit: z.string().optional(),
  stock_quantity: z.coerce.number().min(0, 'Stock cannot be negative'),
  min_stock: z.coerce.number().min(0).optional(),
  max_stock: z.coerce.number().min(0).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  slug: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived', 'hidden']),
  is_featured: z.boolean().default(false),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  brand_id: z.string().optional().nullable(),
  supplier_id: z.string().optional().nullable(),
  warehouse_location: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const STEPS = [
  { id: 'basic', label: 'Basic Information', icon: Box, fields: ['name', 'category_id', 'brand_id', 'supplier_id', 'sku', 'barcode'] },
  { id: 'details', label: 'Product Details', icon: FileText, fields: ['short_description', 'description'] },
  { id: 'media', label: 'Media', icon: ImageIcon, fields: [] },
  { id: 'pricing', label: 'Pricing', icon: CreditCard, fields: ['regular_price', 'sale_price', 'cost_price', 'tax_class'] },
  { id: 'inventory', label: 'Inventory', icon: Package, fields: ['stock_quantity', 'min_stock', 'max_stock', 'warehouse_location', 'unit', 'weight'] },
  { id: 'seo', label: 'SEO', icon: Search, fields: ['seo_title', 'seo_description', 'seo_keywords', 'slug'] },
  { id: 'status', label: 'Status', icon: Check, fields: ['status', 'is_featured'] }
];

export default function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = id && id !== 'new';
  
  const [activeStep, setActiveStep] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Taxonomies
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const { register, handleSubmit, watch, control, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'draft',
      is_featured: false,
      stock_quantity: 0,
      regular_price: 0,
      category_id: '',
    }
  });

  useEffect(() => {
    fetchTaxonomies();
    if (isEditing) {
      fetchProduct();
    }
  }, [isEditing, id]);

  const fetchTaxonomies = async () => {
    try {
      const [catRes, brandsRes, suppliersRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name')
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (brandsRes.data) setBrands(brandsRes.data);
      if (suppliersRes.data) setSuppliers(suppliersRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      
      if (error) throw error;
      if (data) {
        Object.keys(data).forEach((key) => {
          if (key === 'attributes' || key === 'id' || key === 'created_at' || key === 'updated_at') return;
          setValue(key as any, data[key] === null ? undefined : data[key]);
        });
        
        // Fetch images
        const { data: imgData } = await supabase.from('product_images').select('*').eq('product_id', id).order('sort_order');
        if (imgData) {
          setImages(imgData.map(img => img.image_url));
        }
      }
    } catch (error: any) {
      toast.error('Failed to load product');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setImages([...images, publicUrl]);
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      let productId = id;

      const productData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([{ ...productData, created_at: new Date().toISOString() }])
          .select()
          .single();
          
        if (error) throw error;
        productId = newProduct.id;
      }

      // Handle images
      if (productId) {
        // Delete old images
        await supabase.from('product_images').delete().eq('product_id', productId);
        
        // Insert new images
        if (images.length > 0) {
          const imageRecords = images.map((url, index) => ({
            product_id: productId,
            image_url: url,
            is_primary: index === 0,
            sort_order: index
          }));
          await supabase.from('product_images').insert(imageRecords);
        }
      }

      toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
      navigate('/admin/products');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save product');
    }
  };

  const stepStatus = (stepId: string) => {
    const step = STEPS.find(s => s.id === stepId);
    if (!step) return 'unstarted';

    const hasError = step.fields.some(field => errors[field as keyof ProductFormData]);
    if (hasError) return 'error';

    return 'complete';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF5EC]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5EC] flex flex-col font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#FFFDF8] border-b border-[#E8DCC9] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/admin/products" className="p-2 hover:bg-[#E8DCC9] rounded-full transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-[#5F5A54]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#3A2418] leading-tight">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-sm text-[#5F5A54] hidden sm:block">
              {isEditing ? 'Update product details and inventory.' : 'Create a new product for your catalog.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Link to="/admin/products">
            <button type="button" className="px-4 py-2 text-sm font-medium text-[#5F5A54] bg-[#FFFDF8] border border-slate-300 rounded-lg hover:bg-[#FAF5EC] transition-colors shadow-sm">
              Cancel
            </button>
          </Link>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#C65A28] rounded-lg hover:bg-[#C65A28] disabled:opacity-70 flex items-center gap-2 shadow-sm transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left Navigation Steps (Sidebar) */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="sticky top-[100px] bg-[#FFFDF8] rounded-xl border border-[#E8DCC9] shadow-sm overflow-hidden p-2">
            <nav className="flex flex-col gap-1">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const status = stepStatus(step.id);
                const isActive = activeStep === step.id;

                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    type="button"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                      isActive ? "bg-[#E8DCC9] text-[#3A2418]" : "text-[#5F5A54] hover:bg-[#FAF5EC] hover:text-[#3A2418]"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-[#C65A28]" : "text-[#8B857D]")} />
                    <span className="flex-1">{step.label}</span>
                    {status === 'error' && <AlertCircle className="w-4 h-4 text-[#B94A48] shrink-0" />}
                    {status === 'complete' && <Check className="w-4 h-4 text-[#C65A28] opacity-50 shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 max-w-4xl">
          <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:space-y-8 pb-20">
            
            {/* Basic Information */}
            <div className={cn("bg-[#FFFDF8] p-5 sm:p-6 rounded-xl border border-[#E8DCC9] shadow-sm space-y-5 sm:space-y-6", activeStep !== 'basic' && "hidden")}>
              <h2 className="text-lg font-bold text-[#3A2418] flex items-center gap-2">
                <Box className="w-5 h-5 text-[#C65A28]" /> Basic Information
              </h2>
              
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <Label htmlFor="name" className="text-[#5F5A54]">Product Name <span className="text-[#B94A48]">*</span></Label>
                  <Input id="name" {...register('name')} placeholder="e.g. Organic Bananas 1kg" className={cn("mt-1.5", errors.name && 'border-rose-500')} />
                  {errors.name && <p className="text-sm text-[#B94A48] mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{errors.name.message as string}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label className="text-[#5F5A54] mb-1.5 block">Category <span className="text-[#B94A48]">*</span></Label>
                    <Controller
                      name="category_id"
                      control={control}
                      render={({ field }) => (
                        <DynamicCategorySelector
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.category_id?.message as string}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label className="text-[#5F5A54] mb-1.5 block">Brand</Label>
                    <Controller
                      name="brand_id"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={brands.map(b => ({ value: b.id, label: b.name }))}
                          value={field.value || undefined}
                          onChange={field.onChange}
                          placeholder="Select Brand"
                          searchPlaceholder="Search brands..."
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label className="text-[#5F5A54] mb-1.5 block">Supplier</Label>
                    <Controller
                      name="supplier_id"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                          value={field.value || undefined}
                          onChange={field.onChange}
                          placeholder="Select Supplier"
                          searchPlaceholder="Search suppliers..."
                        />
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="sku" className="text-[#5F5A54] block mb-1.5">SKU</Label>
                      <Input id="sku" {...register('sku')} placeholder="SKU-123" />
                    </div>
                    <div>
                      <Label htmlFor="barcode" className="text-[#5F5A54] block mb-1.5">Barcode</Label>
                      <Input id="barcode" {...register('barcode')} placeholder="UPC/EAN" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className={cn("bg-[#FFFDF8] p-5 sm:p-6 rounded-xl border border-[#E8DCC9] shadow-sm space-y-5 sm:space-y-6", activeStep !== 'details' && "hidden")}>
              <h2 className="text-lg font-bold text-[#3A2418] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C65A28]" /> Product Details
              </h2>
              
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <Label htmlFor="short_description" className="text-[#5F5A54] block mb-1.5">Short Description</Label>
                  <Textarea 
                    id="short_description" 
                    {...register('short_description')} 
                    placeholder="Brief summary of the product (shown in grids)"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-[#5F5A54] block mb-1.5">Full Description</Label>
                  <Textarea 
                    id="description" 
                    {...register('description')} 
                    placeholder="Comprehensive product description"
                    rows={6}
                  />
                </div>
              </div>
            </div>

            {/* Media */}
            <div className={cn("bg-[#FFFDF8] p-5 sm:p-6 rounded-xl border border-[#E8DCC9] shadow-sm space-y-5 sm:space-y-6", activeStep !== 'media' && "hidden")}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-[#3A2418] flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#C65A28]" /> Media
                </h2>
                <div className="relative inline-block w-full sm:w-auto">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  />
                  <button type="button" className="w-full sm:w-auto px-4 py-2 text-sm bg-[#E8DCC9] hover:bg-[#E8DCC9] text-[#5F5A54] rounded-lg flex items-center justify-center gap-2 font-medium border border-[#E8DCC9] transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Image
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group aspect-square bg-[#E8DCC9] rounded-xl border border-[#E8DCC9] overflow-hidden">
                    <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-[#C65A28] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        PRIMARY
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-[#FFFDF8]/90 text-[#B94A48] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-[#B94A48]/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {images.length === 0 && (
                  <div className="col-span-full py-12 sm:py-16 flex flex-col items-center justify-center border-2 border-dashed border-[#E8DCC9] rounded-xl bg-[#FAF5EC]/50 text-[#5F5A54] transition-colors hover:bg-[#FAF5EC]">
                    <ImageIcon className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium text-[#5F5A54]">No images uploaded</p>
                    <p className="text-xs mt-1">Click the upload button to add images</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className={cn("bg-[#FFFDF8] p-5 sm:p-6 rounded-xl border border-[#E8DCC9] shadow-sm space-y-5 sm:space-y-6", activeStep !== 'pricing' && "hidden")}>
              <h2 className="text-lg font-bold text-[#3A2418] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#C65A28]" /> Pricing
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="regular_price" className="text-[#5F5A54] block mb-1.5">Regular Price <span className="text-[#B94A48]">*</span></Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-[#5F5A54] sm:text-sm font-medium">KSh</span>
                    </div>
                    <Input id="regular_price" type="number" step="0.01" {...register('regular_price')} className={cn("pl-12", errors.regular_price && 'border-rose-500')} />
                  </div>
                  {errors.regular_price && <p className="text-sm text-[#B94A48] mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{errors.regular_price.message as string}</p>}
                </div>
                <div>
                  <Label htmlFor="sale_price" className="text-[#5F5A54] block mb-1.5">Sale Price (Optional)</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-[#5F5A54] sm:text-sm font-medium">KSh</span>
                    </div>
                    <Input id="sale_price" type="number" step="0.01" {...register('sale_price')} className="pl-12" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cost_price" className="text-[#5F5A54] block mb-1.5">Cost Price (Optional)</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-[#5F5A54] sm:text-sm font-medium">KSh</span>
                    </div>
                    <Input id="cost_price" type="number" step="0.01" {...register('cost_price')} className="pl-12" />
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className={cn("bg-[#FFFDF8] p-5 sm:p-6 rounded-xl border border-[#E8DCC9] shadow-sm space-y-5 sm:space-y-6", activeStep !== 'inventory' && "hidden")}>
              <h2 className="text-lg font-bold text-[#3A2418] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#C65A28]" /> Inventory & Shipping
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="stock_quantity" className="text-[#5F5A54] block mb-1.5">Stock Quantity <span className="text-[#B94A48]">*</span></Label>
                  <Input id="stock_quantity" type="number" {...register('stock_quantity')} className={errors.stock_quantity ? 'border-rose-500' : ''} />
                  {errors.stock_quantity && <p className="text-sm text-[#B94A48] mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{errors.stock_quantity.message as string}</p>}
                </div>
                <div>
                  <Label htmlFor="min_stock" className="text-[#5F5A54] block mb-1.5">Low Stock Alert</Label>
                  <Input id="min_stock" type="number" {...register('min_stock')} placeholder="e.g. 5" />
                </div>
                <div>
                  <Label htmlFor="weight" className="text-[#5F5A54] block mb-1.5">Weight</Label>
                  <div className="flex gap-2">
                    <Input id="weight" type="number" step="0.01" {...register('weight')} placeholder="0.0" className="flex-1" />
                    <Input id="unit" {...register('unit')} placeholder="kg" className="w-16 sm:w-20 shrink-0 text-center" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="warehouse_location" className="text-[#5F5A54] block mb-1.5">Warehouse Loc.</Label>
                  <Input id="warehouse_location" {...register('warehouse_location')} placeholder="Aisle 4, Shelf B" />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className={cn("bg-[#FFFDF8] p-5 sm:p-6 rounded-xl border border-[#E8DCC9] shadow-sm space-y-5 sm:space-y-6", activeStep !== 'seo' && "hidden")}>
              <h2 className="text-lg font-bold text-[#3A2418] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#C65A28]" /> Search Engine Optimization
              </h2>
              
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <Label htmlFor="seo_title" className="text-[#5F5A54] block mb-1.5">SEO Title</Label>
                  <Input id="seo_title" {...register('seo_title')} placeholder="Leave blank to use product name" />
                </div>
                <div>
                  <Label htmlFor="seo_description" className="text-[#5F5A54] block mb-1.5">Meta Description</Label>
                  <Textarea id="seo_description" {...register('seo_description')} placeholder="Brief description for search engines" rows={3} />
                </div>
                <div>
                  <Label htmlFor="slug" className="text-[#5F5A54] block mb-1.5">URL Slug</Label>
                  <div className="flex items-stretch">
                    <span className="bg-[#FAF5EC] border border-r-0 border-[#E8DCC9] px-3 py-2 text-[#5F5A54] rounded-l-md text-sm whitespace-nowrap flex items-center font-mono">/product/</span>
                    <Input id="slug" {...register('slug')} placeholder="custom-product-url" className="rounded-l-none font-mono" />
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className={cn("bg-[#FFFDF8] p-5 sm:p-6 rounded-xl border border-[#E8DCC9] shadow-sm space-y-5 sm:space-y-6", activeStep !== 'status' && "hidden")}>
              <h2 className="text-lg font-bold text-[#3A2418] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#C65A28]" /> Status & Visibility
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <Label className="text-[#5F5A54] block mb-1.5">Product Status</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#C65A28]"></div> Active (Published)</span>
                            </SelectItem>
                            <SelectItem value="draft">
                              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#D9A62E]"></div> Draft</span>
                            </SelectItem>
                            <SelectItem value="hidden">
                              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Hidden</span>
                            </SelectItem>
                            <SelectItem value="archived">
                              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#B94A48]"></div> Archived</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                
                <div className="border-t md:border-t-0 md:border-l border-[#E8DCC9] pt-5 md:pt-0 md:pl-6">
                  <div className="flex items-start space-x-3 p-4 bg-[#FAF5EC]/80 rounded-xl border border-[#E8DCC9] hover:bg-[#FAF5EC] transition-colors">
                    <Controller
                      name="is_featured"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          id="is_featured"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28]"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      )}
                    />
                    <div className="flex-1">
                      <Label htmlFor="is_featured" className="text-[#3A2418] font-bold cursor-pointer">Featured Product</Label>
                      <p className="text-sm text-[#5F5A54] mt-1 leading-relaxed">Show this product in featured sections on the homepage and category pages to increase visibility.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next/Prev Navigation */}
            <div className="flex justify-between items-center pt-2 sm:pt-4">
              <button
                type="button"
                onClick={() => {
                  const currentIndex = STEPS.findIndex(s => s.id === activeStep);
                  if (currentIndex > 0) setActiveStep(STEPS[currentIndex - 1].id);
                }}
                disabled={activeStep === STEPS[0].id}
                className="px-4 py-2 sm:py-2.5 text-sm font-medium text-[#5F5A54] bg-[#FFFDF8] border border-slate-300 rounded-lg hover:bg-[#FAF5EC] disabled:opacity-50 transition-colors shadow-sm"
              >
                Previous Step
              </button>
              
              {activeStep !== STEPS[STEPS.length - 1].id ? (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = STEPS.findIndex(s => s.id === activeStep);
                    if (currentIndex < STEPS.length - 1) setActiveStep(STEPS[currentIndex + 1].id);
                  }}
                  className="px-6 py-2 sm:py-2.5 text-sm font-medium text-white bg-[#3A2418] rounded-lg hover:bg-[#3A2418] transition-colors shadow-sm flex items-center gap-2"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="px-6 py-2 sm:py-2.5 text-sm font-medium text-white bg-[#C65A28] rounded-lg hover:bg-[#C65A28] disabled:opacity-70 transition-colors shadow-sm flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isEditing ? 'Save Product' : 'Create Product'}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
