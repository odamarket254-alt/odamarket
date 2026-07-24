import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { GripVertical, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const DEFAULT_LAYOUT = [
  { id: 'hero', type: 'hero', title: 'Hero Carousel', is_active: true },
  { id: 'categories', type: 'categories', title: 'Shop by Categories', is_active: true },
  { id: 'promotions', type: 'promotions', title: 'Promotional Cards', is_active: true },
  { id: 'best_sellers', type: 'products', title: 'Best Sellers', product_source: 'best_sellers', is_active: true },
  { id: 'weekly_deals', type: 'weekly_deals', title: 'Deal of the Week', is_active: true },
  { id: 'recommended', type: 'products', title: 'Recommended For You', product_source: 'recommended', is_active: true },
  { id: 'why_us', type: 'why_us', title: 'Why Choose Us', is_active: true },
  { id: 'brands', type: 'brands', title: 'Top Brands', is_active: true },
  { id: 'newsletter', type: 'newsletter', title: 'Newsletter', is_active: true }
];

function SortableItem({ section, index, toggleSection, removeSection }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center justify-between p-4 rounded-lg border mb-3 ${section.is_active ? 'bg-[#FFFDF8] border-[#E8DCC9]' : 'bg-[#FAF5EC] border-[#E8DCC9]'}`}>
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab text-[#8B857D] hover:text-[#5F5A54] focus:outline-none">
          <GripVertical className="w-5 h-5" />
        </div>
        <div>
          <div className="font-medium text-[#3A2418] flex items-center gap-2">
            {section.title}
            {!section.is_active && <span className="text-[10px] bg-[#E8DCC9] text-[#5F5A54] px-2 py-0.5 rounded-full">Hidden</span>}
          </div>
          <div className="text-xs text-[#5F5A54] mt-0.5 uppercase tracking-wide">{section.type}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => toggleSection(index)} className="p-2 text-[#8B857D] hover:text-[#5F5A54] rounded-lg hover:bg-[#E8DCC9]">
          {section.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button onClick={() => removeSection(index)} className="p-2 text-red-400 hover:text-[#C65A28] rounded-lg hover:bg-[#B94A48]/10">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function HomepageLayoutManager() {
  const [sections, setSections] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchLayout();
  }, []);

  const fetchLayout = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('group_name', 'storefront')
        .eq('key', 'homepage_layout')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      if (data && data.value) setSections(data.value);
      else setSections(DEFAULT_LAYOUT);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleSection = (index: number) => {
    const newSections = [...sections];
    newSections[index].is_active = !newSections[index].is_active;
    setSections(newSections);
  };

  const removeSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    setSections(newSections);
  };

  const addSection = (type: string) => {
    const newSection = {
      id: `section_${Date.now()}`,
      type,
      title: `New ${type} Section`,
      is_active: true
    };
    setSections([...sections, newSection]);
  };

  const saveLayout = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          group_name: 'storefront',
          key: 'homepage_layout',
          value: sections,
          updated_at: new Date().toISOString()
        }, { onConflict: 'group_name, key' });
        
      if (error) throw error;
      toast.success('Homepage layout saved successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="bg-[#FFFDF8] rounded-xl shadow-sm border border-[#E8DCC9] p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#3A2418]">Homepage Layout Order</h2>
          <p className="text-[#5F5A54] text-sm">Drag and drop to reorder homepage sections.</p>
        </div>
        <Button onClick={saveLayout} disabled={isSaving} className="bg-[#C65A28] text-white hover:bg-[#C65A28]">
          {isSaving ? 'Saving...' : 'Save Layout Order'}
        </Button>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <Button variant="outline" size="sm" onClick={() => addSection('products')}><Plus className="w-4 h-4 mr-1"/> Add Product Row</Button>
        <Button variant="outline" size="sm" onClick={() => addSection('promotions')}><Plus className="w-4 h-4 mr-1"/> Add Promo Cards</Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div>
            {sections.map((section, index) => (
              <SortableItem key={section.id} section={section} index={index} toggleSection={toggleSection} removeSection={removeSection} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
