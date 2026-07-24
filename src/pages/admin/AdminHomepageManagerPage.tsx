import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { HomepageSection, SectionType } from '../../types/homepage';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Plus, Trash2, Edit2, Check, X, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminHomepageManagerPage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<HomepageSection | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      toast.error('Failed to load sections');
    } else if (data) {
      setSections(data);
    }
    setIsLoading(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        
        // Update sort order in db
        const updates = newArray.map((item, index) => ({
          id: item.id,
          sort_order: index
        }));
        
        // Fire and forget update
        supabase.from('homepage_sections').upsert(updates).then(({error}) => {
            if(error) toast.error("Failed to reorder");
        });
        
        return newArray;
      });
    }
  };

  const addSection = async (type: SectionType) => {
    const newSection = {
      name: `New ${type.replace('_', ' ')}`,
      title: `New ${type.replace('_', ' ')}`,
      type,
      is_active: true,
      sort_order: sections.length,
      settings: {
        layout: 'carousel',
        max_products: 10,
        products_per_row_desktop: 5,
        products_per_row_tablet: 4,
        products_per_row_mobile: 2,
        show_view_all: true
      }
    };

    const { data, error } = await supabase
      .from('homepage_sections')
      .insert([newSection])
      .select()
      .single();

    if (error) {
      toast.error('Failed to add section');
    } else {
      toast.success('Section added');
      setSections([...sections, data]);
    }
  };

  const toggleSection = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('homepage_sections')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      setSections(sections.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    const { error } = await supabase
      .from('homepage_sections')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete');
    } else {
      setSections(sections.filter(s => s.id !== id));
      if (selectedSection?.id === id) setSelectedSection(null);
    }
  };

  const updateSection = async (updated: HomepageSection) => {
    const { error } = await supabase
      .from('homepage_sections')
      .update(updated)
      .eq('id', updated.id);

    if (error) {
      toast.error('Failed to update section settings');
    } else {
      toast.success('Section updated');
      setSections(sections.map(s => s.id === updated.id ? updated : s));
      setSelectedSection(updated);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#3A2418]">Homepage Manager</h1>
          <p className="text-[#5F5A54]">Manage all dynamic grids and content on the homepage.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#FFFDF8] rounded-xl shadow-sm border border-[#E8DCC9] p-4">
            <h3 className="font-semibold text-[#3A2418] mb-4">Add Section</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addSection('hero_banner')} className="p-2 text-xs bg-[#FAF5EC] border rounded hover:bg-[#E8DCC9] hover:text-[#C65A28] transition">Hero Banner</button>
              <button onClick={() => addSection('category_grid')} className="p-2 text-xs bg-[#FAF5EC] border rounded hover:bg-[#E8DCC9] hover:text-[#C65A28] transition">Categories</button>
              <button onClick={() => addSection('flash_deals')} className="p-2 text-xs bg-[#FAF5EC] border rounded hover:bg-[#E8DCC9] hover:text-[#C65A28] transition">Flash Deals</button>
              <button onClick={() => addSection('best_sellers')} className="p-2 text-xs bg-[#FAF5EC] border rounded hover:bg-[#E8DCC9] hover:text-[#C65A28] transition">Best Sellers</button>
              <button onClick={() => addSection('featured_products')} className="p-2 text-xs bg-[#FAF5EC] border rounded hover:bg-[#E8DCC9] hover:text-[#C65A28] transition">Featured Grids</button>
              <button onClick={() => addSection('organic')} className="p-2 text-xs bg-[#FAF5EC] border rounded hover:bg-[#E8DCC9] hover:text-[#C65A28] transition">Organic</button>
              <button onClick={() => addSection('new_arrivals')} className="p-2 text-xs bg-[#FAF5EC] border rounded hover:bg-[#E8DCC9] hover:text-[#C65A28] transition">New Arrivals</button>
              <button onClick={() => addSection('odamarket_choice')} className="p-2 text-xs bg-[#FAF5EC] border rounded hover:bg-[#E8DCC9] hover:text-[#C65A28] transition">Choice</button>
            </div>
          </div>

          <div className="bg-[#FFFDF8] rounded-xl shadow-sm border border-[#E8DCC9] p-4">
            <h3 className="font-semibold text-[#3A2418] mb-4">Layout Order</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <SortableSection 
                      key={section.id} 
                      section={section} 
                      onToggle={() => toggleSection(section.id, section.is_active)}
                      onDelete={() => deleteSection(section.id)}
                      onEdit={() => setSelectedSection(section)}
                      isSelected={selectedSection?.id === section.id}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedSection ? (
            <SectionEditor 
              section={selectedSection} 
              onSave={updateSection}
            />
          ) : (
            <div className="bg-[#FFFDF8] rounded-xl shadow-sm border border-[#E8DCC9] p-12 text-center text-[#5F5A54]">
              Select a section to edit its settings
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableSection({ section, onToggle, onDelete, onEdit, isSelected }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
        isSelected ? 'border-[#C65A28] bg-[#E8DCC9]' : 'bg-[#FFFDF8] border-[#E8DCC9] hover:border-slate-300'
      } ${!section.is_active ? 'opacity-60' : ''}`}
      onClick={onEdit}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div {...attributes} {...listeners} className="cursor-grab text-[#8B857D] hover:text-[#5F5A54]">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="truncate">
          <div className="text-sm font-medium text-[#3A2418] truncate">{section.title || section.name}</div>
          <div className="text-[10px] text-[#5F5A54] uppercase">{section.type.replace('_', ' ')}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-1.5 text-[#8B857D] hover:text-[#5F5A54] rounded hover:bg-[#E8DCC9]">
          {section.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-red-400 hover:text-[#C65A28] rounded hover:bg-[#B94A48]/10">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function SectionEditor({ section, onSave }: { section: HomepageSection, onSave: (s: HomepageSection) => void }) {
  const [formData, setFormData] = useState(section);

  // Sync state when selected section changes
  useEffect(() => {
    setFormData(section);
  }, [section]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingChange = (field: string, value: any) => {
    setFormData(prev => ({ 
      ...prev, 
      settings: { ...prev.settings, [field]: value } 
    }));
  };

  const handleFilterChange = (field: string, value: any) => {
    setFormData(prev => ({ 
      ...prev, 
      settings: { 
        ...prev.settings, 
        filters: { ...(prev.settings?.filters || {}), [field]: value } 
      } 
    }));
  };

  return (
    <div className="bg-[#FFFDF8] rounded-xl shadow-sm border border-[#E8DCC9] overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-[#E8DCC9] flex justify-between items-center bg-[#FAF5EC]">
        <h2 className="font-bold text-[#3A2418]">Edit Section</h2>
        <button 
          onClick={() => onSave(formData)}
          className="bg-[#C65A28] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#C65A28] transition"
        >
          Save Changes
        </button>
      </div>
      
      <div className="p-6 overflow-y-auto flex-grow space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#5F5A54] mb-1">Internal Name</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => handleChange('name', e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5F5A54] mb-1">Public Title</label>
            <input 
              type="text" 
              value={formData.title || ''} 
              onChange={e => handleChange('title', e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-[#5F5A54] mb-1">Subtitle</label>
            <input 
              type="text" 
              value={formData.subtitle || ''} 
              onChange={e => handleChange('subtitle', e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            />
          </div>
        </div>

        {/* Display Settings */}
        <div className="border-t border-[#E8DCC9] pt-6">
          <h3 className="font-semibold text-[#3A2418] mb-4">Display Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5F5A54] mb-1">Layout</label>
              <select 
                value={formData.settings?.layout || 'carousel'} 
                onChange={e => handleSettingChange('layout', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              >
                <option value="carousel">Horizontal Carousel</option>
                <option value="grid">Multi-row Grid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5F5A54] mb-1">Max Products</label>
              <input 
                type="number" 
                value={formData.settings?.max_products || 10} 
                onChange={e => handleSettingChange('max_products', parseInt(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5F5A54] mb-1">Background Color</label>
              <input 
                type="text" 
                placeholder="#ffffff or slate-900"
                value={formData.settings?.background_color || ''} 
                onChange={e => handleSettingChange('background_color', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.settings?.show_view_all || false}
                  onChange={e => handleSettingChange('show_view_all', e.target.checked)}
                  className="rounded text-[#C65A28] focus:ring-[#C65A28]"
                />
                <span className="text-sm font-medium text-[#5F5A54]">Show "View All" Link</span>
              </label>
            </div>
          </div>
        </div>

        {/* Grid Filters (Only show if it's a dynamic grid that uses filters) */}
        {['best_sellers', 'new_arrivals', 'top_rated', 'trending', 'budget_deals'].includes(formData.type) && (
          <div className="border-t border-[#E8DCC9] pt-6">
            <h3 className="font-semibold text-[#3A2418] mb-4">Grid Filters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#5F5A54] mb-1">Category ID Filter</label>
                <input 
                  type="text" 
                  value={formData.settings?.filters?.category_id || ''} 
                  onChange={e => handleFilterChange('category_id', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5F5A54] mb-1">Brand ID Filter</label>
                <input 
                  type="text" 
                  value={formData.settings?.filters?.brand_id || ''} 
                  onChange={e => handleFilterChange('brand_id', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5F5A54] mb-1">Min Price</label>
                <input 
                  type="number" 
                  value={formData.settings?.filters?.min_price || ''} 
                  onChange={e => handleFilterChange('min_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5F5A54] mb-1">Max Price</label>
                <input 
                  type="number" 
                  value={formData.settings?.filters?.max_price || ''} 
                  onChange={e => handleFilterChange('max_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Manual Grid Products Manager */}
        {['featured_products', 'flash_deals', 'odamarket_choice', 'buy_more_save_more', 'custom_grid'].includes(formData.type) && (
          <div className="border-t border-[#E8DCC9] pt-6">
            <h3 className="font-semibold text-[#3A2418] mb-4">Selected Products</h3>
            <ManualProductSelector sectionId={formData.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function ManualProductSelector({ sectionId }: { sectionId: string }) {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSelectedProducts();
  }, [sectionId]);

  const fetchSelectedProducts = async () => {
    const { data, error } = await supabase
      .from('featured_products')
      .select('*, products(id, name, price, image_url)')
      .eq('section_id', sectionId)
      .order('sort_order', { ascending: true });
    
    if (data) {
      setSelectedProducts(data);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('products')
      .select('id, name, price, image_url')
      .ilike('name', `%${query}%`)
      .limit(5);
    
    if (data) setSearchResults(data);
  };

  const addProduct = async (product: any) => {
    const { error } = await supabase
      .from('featured_products')
      .insert({
        section_id: sectionId,
        product_id: product.id,
        sort_order: selectedProducts.length
      });
    
    if (!error) {
      setSearchQuery('');
      setSearchResults([]);
      fetchSelectedProducts();
    }
  };

  const removeProduct = async (id: string) => {
    const { error } = await supabase
      .from('featured_products')
      .delete()
      .eq('id', id);
    if (!error) fetchSelectedProducts();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-2.5 text-[#8B857D]" />
        <input 
          type="text" 
          placeholder="Search products to add..." 
          value={searchQuery}
          onChange={handleSearch}
          className="w-full border border-slate-300 rounded-lg pl-10 p-2.5 text-sm"
        />
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#FFFDF8] border border-[#E8DCC9] shadow-lg rounded-lg z-10 max-h-60 overflow-y-auto">
            {searchResults.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border-b border-[#E8DCC9] hover:bg-[#FAF5EC]">
                <div className="flex items-center gap-3">
                  <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-[#5F5A54]">Ksh {p.price}</div>
                  </div>
                </div>
                <button 
                  onClick={() => addProduct(p)}
                  className="text-[#C65A28] bg-[#E8DCC9] px-3 py-1 rounded-md text-sm font-medium hover:bg-[#E8DCC9]"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {selectedProducts.map((sp) => (
          <div key={sp.id} className="flex items-center justify-between bg-[#FAF5EC] border border-[#E8DCC9] p-2 rounded-lg">
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-[#8B857D] cursor-grab" />
              <img src={sp.products.image_url} alt="" className="w-8 h-8 rounded object-cover" />
              <span className="text-sm font-medium">{sp.products.name}</span>
            </div>
            <button 
              onClick={() => removeProduct(sp.id)}
              className="text-[#B94A48] p-1 hover:bg-[#B94A48]/10 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {selectedProducts.length === 0 && (
          <div className="text-sm text-[#5F5A54] text-center py-4">No products selected yet.</div>
        )}
      </div>
    </div>
  );
}
