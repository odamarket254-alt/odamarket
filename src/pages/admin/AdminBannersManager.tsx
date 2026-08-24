import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { HomepageSection, HomepageBanner } from '../../types/homepage';
import { Plus, GripVertical, Trash2, Edit2, Check, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ImageUpload } from '../../components/ui/ImageUpload';

function SortableBannerItem({ 
  banner, 
  index, 
  isEditing, 
  editForm, 
  setEditForm, 
  setIsEditing, 
  handleSaveEdit, 
  handleDelete, 
  toggleActive 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className={`border border-gray-200 rounded-xl overflow-hidden ${isDragging ? 'shadow-lg bg-white ring-2 ring-orange-400' : 'bg-gray-50'} flex flex-col md:flex-row`}>
      {/* Drag Handle & Image Preview */}
      <div className="w-full md:w-56 flex bg-gray-200 relative shrink-0">
        <div {...attributes} {...listeners} className="flex items-center justify-center w-8 bg-gray-100 hover:bg-gray-200 cursor-grab active:cursor-grabbing border-r border-gray-200 shrink-0">
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
        <div className="flex-1 h-32 relative">
          {banner.desktop_image_url ? (
            <img src={banner.desktop_image_url} alt={banner.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-400">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
          {!banner.is_active && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">Inactive</div>
          )}
        </div>
      </div>
      
      {/* Details */}
      <div className="p-4 flex-1">
        {isEditing === banner.id ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full text-sm border-gray-300 rounded-md p-2 border" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subtitle</label>
                <input type="text" value={editForm.subtitle || ''} onChange={e => setEditForm({...editForm, subtitle: e.target.value})} className="w-full text-sm border-gray-300 rounded-md p-2 border" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Badge (e.g. FLASH SALE)</label>
                <input type="text" value={editForm.badge || ''} onChange={e => setEditForm({...editForm, badge: e.target.value})} className="w-full text-sm border-gray-300 rounded-md p-2 border" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Overlay Opacity (%)</label>
                  <input type="number" min="0" max="100" value={editForm.bg_overlay_opacity || 0} onChange={e => setEditForm({...editForm, bg_overlay_opacity: parseInt(e.target.value)})} className="w-full text-sm border-gray-300 rounded-md p-2 border" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Overlay Color</label>
                  <input type="color" value={editForm.bg_color || '#000000'} onChange={e => setEditForm({...editForm, bg_color: e.target.value})} className="w-full h-[38px] cursor-pointer rounded-md border-0 p-0" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Desktop Image</label>
                <ImageUpload 
                  value={editForm.desktop_image_url || ''} 
                  onChange={url => setEditForm({...editForm, desktop_image_url: url})}
                  bucket="banners"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Image (Optional)</label>
                <ImageUpload 
                  value={editForm.mobile_image_url || ''} 
                  onChange={url => setEditForm({...editForm, mobile_image_url: url})}
                  bucket="banners"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Primary CTA Text</label>
                  <input type="text" value={editForm.button_text || ''} onChange={e => setEditForm({...editForm, button_text: e.target.value})} className="w-full text-sm border-gray-300 rounded-md p-2 border" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Primary CTA URL</label>
                  <input type="text" value={editForm.button_link || ''} onChange={e => setEditForm({...editForm, button_link: e.target.value})} className="w-full text-sm border-gray-300 rounded-md p-2 border" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Secondary CTA Text</label>
                  <input type="text" value={editForm.secondary_button_text || ''} onChange={e => setEditForm({...editForm, secondary_button_text: e.target.value})} className="w-full text-sm border-gray-300 rounded-md p-2 border" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Secondary CTA URL</label>
                  <input type="text" value={editForm.secondary_button_link || ''} onChange={e => setEditForm({...editForm, secondary_button_link: e.target.value})} className="w-full text-sm border-gray-300 rounded-md p-2 border" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="datetime-local" value={editForm.start_date?.slice(0, 16) || ''} onChange={e => setEditForm({...editForm, start_date: e.target.value ? new Date(e.target.value).toISOString() : null})} className="w-full text-sm border-gray-300 rounded-md p-2 border" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input type="datetime-local" value={editForm.end_date?.slice(0, 16) || ''} onChange={e => setEditForm({...editForm, end_date: e.target.value ? new Date(e.target.value).toISOString() : null})} className="w-full text-sm border-gray-300 rounded-md p-2 border" />
                </div>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2 pt-4 border-t">
              <button onClick={() => setIsEditing(null)} className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-md">Cancel</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-black text-white font-medium hover:bg-gray-800 rounded-md">Save Changes</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start h-full">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-gray-900">{banner.title}</h3>
                {banner.badge && <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">{banner.badge}</span>}
              </div>
              <p className="text-sm text-gray-500 mb-2">{banner.subtitle}</p>
              <div className="flex gap-2 text-xs">
                {banner.button_text && <span className="bg-gray-200 px-2 py-1 rounded">Primary: {banner.button_text}</span>}
                {banner.secondary_button_text && <span className="bg-gray-200 px-2 py-1 rounded">Secondary: {banner.secondary_button_text}</span>}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 items-end">
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(banner.id, banner.is_active)} className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${banner.is_active ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => { setIsEditing(banner.id); setEditForm(banner); }} className="p-1.5 text-gray-500 hover:text-[#F97316] hover:bg-orange-50 rounded-md transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(banner.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminBannersManager() {
  const [section, setSection] = useState<HomepageSection | null>(null);
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<HomepageBanner>>({});
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('type', 'hero_banner')
      .limit(1)
      .single();

    if (data) {
      const mapped = {
        ...data,
        name: data.name || data.title || '',
        settings: data.settings || data.content || {}
      };
      setSection(mapped);
      setBanners(mapped.settings?.banners?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)) || []);
    } else {
      // Create it if it doesn't exist
      const newSection = {
        title: 'Hero Banners',
        type: 'hero_banner',
        is_active: true,
        sort_order: 0,
        content: { banners: [] }
      };
      const { data: created, error: createError } = await supabase
        .from('homepage_sections')
        .insert(newSection)
        .select()
        .single();
        
      if (created) {
        const mappedCreated = {
          ...created,
          name: created.name || created.title || '',
          settings: created.settings || created.content || {}
        };
        setSection(mappedCreated);
        setBanners([]);
      }
    }
    setLoading(false);
  };

  const saveBanners = async (updatedBanners: HomepageBanner[]) => {
    if (!section) return;
    
    // Ensure positions are updated based on array order before saving
    const positionedBanners = updatedBanners.map((b, i) => ({ ...b, position: i }));
    
    const { error } = await supabase
      .from('homepage_sections')
      .update({
        content: { ...section.settings, banners: positionedBanners }
      })
      .eq('id', section.id);

    if (error) {
      toast.error('Failed to save banners');
    } else {
      setBanners(positionedBanners);
      toast.success('Banners updated successfully');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);
      
      const newArray = arrayMove(banners, oldIndex, newIndex);
      setBanners(newArray); // Optimistic UI update
      await saveBanners(newArray);
    }
  };

  const handleAdd = () => {
    const newBanner: HomepageBanner = {
      id: crypto.randomUUID(),
      title: 'New Banner',
      subtitle: '',
      badge: '',
      button_text: 'Shop Now',
      button_link: '/',
      secondary_button_text: '',
      secondary_button_link: '',
      bg_overlay_opacity: 20,
      bg_color: '#000000',
      desktop_image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80',
      mobile_image_url: '',
      is_active: false,
      position: banners.length,
      start_date: null,
      end_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setIsEditing(newBanner.id);
    setEditForm(newBanner);
    setBanners([...banners, newBanner]);
  };

  const handleSaveEdit = () => {
    if (!isEditing) return;
    const updated = banners.map(b => b.id === isEditing ? { ...b, ...editForm, updated_at: new Date().toISOString() } as HomepageBanner : b);
    saveBanners(updated);
    setIsEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    const updated = banners.filter(b => b.id !== id);
    saveBanners(updated);
  };

  const toggleActive = (id: string, current: boolean) => {
    const updated = banners.map(b => b.id === id ? { ...b, is_active: !current } : b);
    saveBanners(updated);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Hero Banners</h2>
        <button onClick={handleAdd} className="bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={banners.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {banners.map((banner, index) => (
              <SortableBannerItem 
                key={banner.id} 
                banner={banner} 
                index={index} 
                isEditing={isEditing}
                editForm={editForm}
                setEditForm={setEditForm}
                setIsEditing={setIsEditing}
                handleSaveEdit={handleSaveEdit}
                handleDelete={handleDelete}
                toggleActive={toggleActive}
              />
            ))}
            {banners.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <h3 className="text-lg font-medium text-gray-900 mb-1">No banners</h3>
                <p className="text-sm text-gray-500">Add a banner to display on the homepage slider.</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
