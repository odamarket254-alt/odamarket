import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { OptimizedImage } from '../../ui/OptimizedImage';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Loader2, Plus, Trash2, Edit, Save, ArrowLeft, GripVertical, Image as ImageIcon, Upload, X, Eye, EyeOff } from 'lucide-react';
import { HomepageBanner } from '../../../types/homepage';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableBannerItemProps {
  banner: HomepageBanner;
  onEdit: (banner: HomepageBanner) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, current: boolean) => void;
}

function SortableBannerItem({ banner, onEdit, onDelete, onToggleActive }: SortableBannerItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const isActive = banner.is_active;

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center mb-3 shadow-sm ${isActive ? 'border-[#E8DCC9]' : 'border-gray-200 opacity-75'}`}>
      <div {...attributes} {...listeners} className="cursor-grab hover:text-primary active:cursor-grabbing p-2 text-gray-400">
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="w-full md:w-48 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative border border-gray-100">
        {banner.desktop_image_url ? (
          <OptimizedImage src={banner.desktop_image_url} alt={banner.title} className="w-full h-full" imgClassName="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-8 h-8" /></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-lg text-[#3A2418] truncate">{banner.title}</h4>
        {banner.subtitle && <p className="text-sm text-gray-500 truncate">{banner.subtitle}</p>}
        <div className="flex gap-2 mt-2 items-center">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {isActive ? 'Active' : 'Hidden'}
          </span>
          {banner.start_date && banner.end_date && (
            <span className="text-xs text-gray-500">
              {new Date(banner.start_date).toLocaleDateString()} - {new Date(banner.end_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-row md:flex-col gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={() => onEdit(banner)}>
          <Edit className="w-4 h-4 mr-2" /> Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => onToggleActive(banner.id, banner.is_active)}>
          {isActive ? <><EyeOff className="w-4 h-4 mr-2" /> Disable</> : <><Eye className="w-4 h-4 mr-2" /> Enable</>}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(banner.id)}>
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </Button>
      </div>
    </div>
  );
}

export function HomepageBannersManager() {
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<HomepageBanner>>({});
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false);
  const [isUploadingMobile, setIsUploadingMobile] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBanners();
    
    // Subscribe to changes
    const channel = supabase.channel('homepage_banners_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_banners' }, () => {
        fetchBanners();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('*')
        .order('position', { ascending: true });
        
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet, gracefully handle
          console.warn("Table homepage_banners does not exist.");
          setBanners([]);
        } else {
          throw error;
        }
      } else {
        setBanners(data || []);
      }
    } catch (err: any) {
      console.error("Error fetching banners:", err);
      toast.error("Failed to load banners");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBanners((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update positions in DB
        updatePositions(newItems);
        return newItems;
      });
    }
  };

  const updatePositions = async (items: HomepageBanner[]) => {
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        title: item.title,
        desktop_image_url: item.desktop_image_url,
        position: index
      }));
      
      const { error } = await supabase.from('homepage_banners').upsert(updates, { onConflict: 'id' });
      if (error) throw error;
      toast.success("Positions updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update positions");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (type === 'desktop') setIsUploadingDesktop(true);
    else setIsUploadingMobile(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('homepage-banners')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('homepage-banners').getPublicUrl(fileName);
      
      if (type === 'desktop') {
        setEditingBanner({ ...editingBanner, desktop_image_url: data.publicUrl });
      } else {
        setEditingBanner({ ...editingBanner, mobile_image_url: data.publicUrl });
      }
      toast.success("Image uploaded!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      if (type === 'desktop') setIsUploadingDesktop(false);
      else setIsUploadingMobile(false);
    }
  };

  const saveBanner = async () => {
    if (!editingBanner.title || !editingBanner.desktop_image_url) {
      toast.error("Title and Desktop Image are required");
      return;
    }

    try {
      if (editingBanner.id) {
        const { error } = await supabase.from('homepage_banners')
          .update(editingBanner)
          .eq('id', editingBanner.id);
        if (error) throw error;
        toast.success("Banner updated!");
      } else {
        const { error } = await supabase.from('homepage_banners')
          .insert([{ ...editingBanner, position: banners.length }]);
        if (error) throw error;
        toast.success("Banner created!");
      }
      setIsEditing(false);
      fetchBanners();
    } catch (err: any) {
      console.error(err);
      if (err.code === '42P01') {
         toast.error("Database table missing. Please run migrations.");
      } else {
         toast.error(err.message || "Failed to save banner");
      }
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const { error } = await supabase.from('homepage_banners').delete().eq('id', id);
      if (error) throw error;
      toast.success("Banner deleted");
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete banner");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from('homepage_banners').update({ is_active: !current }).eq('id', id);
      if (error) throw error;
      toast.success(`Banner ${!current ? 'activated' : 'deactivated'}`);
      fetchBanners();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E8DCC9]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{editingBanner.id ? 'Edit Banner' : 'New Banner'}</h2>
          <Button variant="ghost" onClick={() => setIsEditing(false)}><X className="w-5 h-5" /></Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={editingBanner.title || ''} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} placeholder="Main heading" />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={editingBanner.subtitle || ''} onChange={e => setEditingBanner({...editingBanner, subtitle: e.target.value})} placeholder="Secondary text" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Text</Label>
                <Input value={editingBanner.button_text || ''} onChange={e => setEditingBanner({...editingBanner, button_text: e.target.value})} placeholder="Shop Now" />
              </div>
              <div>
                <Label>Button Link</Label>
                <Input value={editingBanner.button_link || ''} onChange={e => setEditingBanner({...editingBanner, button_link: e.target.value})} placeholder="/category/fresh" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={editingBanner.start_date ? editingBanner.start_date.split('T')[0] : ''} onChange={e => setEditingBanner({...editingBanner, start_date: e.target.value ? new Date(e.target.value).toISOString() : null})} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={editingBanner.end_date ? editingBanner.end_date.split('T')[0] : ''} onChange={e => setEditingBanner({...editingBanner, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="isActive" checked={editingBanner.is_active ?? true} onChange={e => setEditingBanner({...editingBanner, is_active: e.target.checked})} className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" />
              <Label htmlFor="isActive">Active Banner</Label>
            </div>
            <div>
               <Label>Background Color (Hex)</Label>
               <Input value={editingBanner.bg_color || ''} onChange={e => setEditingBanner({...editingBanner, bg_color: e.target.value})} placeholder="#FFFFFF" />
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <Label>Desktop Image (1920x700) *</Label>
              <div className="mt-2 relative h-40 border-2 border-dashed border-[#E8DCC9] rounded-xl flex flex-col items-center justify-center hover:bg-[#FAF5EC] cursor-pointer transition-colors overflow-hidden">
                {editingBanner.desktop_image_url ? (
                  <OptimizedImage src={editingBanner.desktop_image_url} alt="Desktop" className="w-full h-full" imgClassName="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    {isUploadingDesktop ? <Loader2 className="w-6 h-6 animate-spin mb-2" /> : <Upload className="w-6 h-6 mb-2" />}
                    <span className="text-sm">Upload Desktop Image</span>
                  </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, 'desktop')} accept="image/*" />
              </div>
            </div>
            
            <div>
              <Label>Mobile Image (1080x1350) (Optional)</Label>
              <div className="mt-2 relative h-48 w-32 mx-auto border-2 border-dashed border-[#E8DCC9] rounded-xl flex flex-col items-center justify-center hover:bg-[#FAF5EC] cursor-pointer transition-colors overflow-hidden">
                {editingBanner.mobile_image_url ? (
                  <OptimizedImage src={editingBanner.mobile_image_url} alt="Mobile" className="w-full h-full" imgClassName="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-500 text-center px-2">
                    {isUploadingMobile ? <Loader2 className="w-6 h-6 animate-spin mb-2 mx-auto" /> : <Upload className="w-6 h-6 mb-2 mx-auto" />}
                    <span className="text-[10px]">Upload Mobile</span>
                  </div>
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, 'mobile')} accept="image/*" />
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">Will fallback to desktop image if not provided.</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[#E8DCC9]">
          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button onClick={saveBanner}><Save className="w-4 h-4 mr-2" /> Save Banner</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-[#3A2418]">Homepage Banners</h2>
          <p className="text-sm text-[#5F5A54]">Manage the main carousel banners on the homepage.</p>
        </div>
        <Button onClick={() => { setEditingBanner({ is_active: true }); setIsEditing(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="bg-white border border-[#E8DCC9] rounded-2xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No Banners Found</h3>
          <p className="text-gray-500 mb-6">Create your first homepage banner to showcase promotions.</p>
          <Button onClick={() => { setEditingBanner({ is_active: true }); setIsEditing(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Create Banner
          </Button>
        </div>
      ) : (
        <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-[#E8DCC9]">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={banners} strategy={verticalListSortingStrategy}>
              {banners.map((banner) => (
                <SortableBannerItem
                  key={banner.id}
                  banner={banner}
                  onEdit={(b) => { setEditingBanner(b); setIsEditing(true); }}
                  onDelete={deleteBanner}
                  onToggleActive={toggleActive}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
