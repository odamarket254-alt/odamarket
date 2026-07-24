import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Combobox } from '../../ui/Combobox';
import { Category } from '../../../types/category';
import { CategoryFormModal } from './CategoryFormModal';

interface DynamicCategorySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function DynamicCategorySelector({ value, onChange, error }: DynamicCategorySelectorProps) {
  const [selectedPath, setSelectedPath] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentForNew, setParentForNew] = useState<string>("");

  // Fetch all categories for the modal
  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true });
      if (error) throw error;
      return data as Category[];
    }
  });

  useEffect(() => {
    // If value is set externally, we need to construct the path backwards
    const constructPath = async (leafId: string) => {
      if (!allCategories.length) return;
      const path: Category[] = [];
      let currentId: string | null = leafId;
      while (currentId) {
        const cat = allCategories.find(c => c.id === currentId);
        if (cat) {
          path.unshift(cat);
          currentId = cat.parent_id;
        } else {
          currentId = null;
        }
      }
      setSelectedPath(path);
    };

    if (value && (!selectedPath.length || selectedPath[selectedPath.length - 1]?.id !== value)) {
      constructPath(value);
    }
  }, [value, allCategories]);

  const handleSelect = (categoryId: string, level: number) => {
    if (!categoryId) {
      // Clear this level and everything below
      const newPath = selectedPath.slice(0, level);
      setSelectedPath(newPath);
      onChange(newPath.length > 0 ? newPath[newPath.length - 1].id : "");
      return;
    }
    const cat = allCategories.find(c => c.id === categoryId);
    if (cat) {
      const newPath = [...selectedPath.slice(0, level), cat];
      setSelectedPath(newPath);
      onChange(cat.id);
    }
  };

  // Render a dropdown for each level
  // Level 0: top level (parent_id is null)
  // Level 1: children of selectedPath[0]
  // Level 2: children of selectedPath[1]
  // etc.

  const levelsToRender = [];
  let currentParentId: string | null = null;
  let level = 0;

  while (true) {
    const parentIdForThisLevel = currentParentId;
    const optionsForThisLevel = allCategories.filter(c => c.parent_id === parentIdForThisLevel);
    
    // If there are no options for this level, and it's not the root level, we break
    // EXCEPT if we want to allow creating a subcategory here. But for simplicity, we only show dropdown if there are options, or if it's root.
    if (optionsForThisLevel.length === 0 && level > 0 && selectedPath.length < level) {
      break;
    }

    if (level > selectedPath.length) {
      break;
    }

    const levelOptions = optionsForThisLevel.map(c => ({ label: c.name, value: c.id }));
    const selectedValue = selectedPath[level]?.id || "";

    const levelIndex = level;

    levelsToRender.push(
      <div key={`level-${level}`} className="space-y-1">
        <label className="block text-xs font-medium text-[#5F5A54]">
          {level === 0 ? "Main Category" : level === 1 ? "Subcategory" : "Leaf Category"}
        </label>
        <Combobox
          options={levelOptions}
          value={selectedValue}
          onChange={(val) => handleSelect(val, levelIndex)}
          placeholder={`Select ${level === 0 ? "main category" : "subcategory"}...`}
          searchPlaceholder="Search category..."
          emptyText="No categories found."
          onCreateNew={() => {
            setParentForNew(parentIdForThisLevel || "");
            setIsModalOpen(true);
          }}
          createNewText={`+ New ${level === 0 ? "Category" : "Subcategory"}`}
        />
      </div>
    );

    if (!selectedValue) break; // Don't render next level if current is not selected
    
    // Check if the selected item has children
    const hasChildren = allCategories.some(c => c.parent_id === selectedValue);
    if (!hasChildren && selectedValue === selectedPath[level]?.id) {
       // If no children, but user selected it, we stop unless we want them to add a leaf.
       // Let's allow adding a child even if none exist by rendering the next level empty.
       currentParentId = selectedValue;
       level++;
       const nextLevelOptions = allCategories.filter(c => c.parent_id === currentParentId);
       if (nextLevelOptions.length === 0) {
           levelsToRender.push(
            <div key={`level-${level}-add`} className="space-y-1">
                <label className="block text-xs font-medium text-[#5F5A54]">
                {level === 1 ? "Subcategory" : "Leaf Category"}
                </label>
                <div 
                  className="flex items-center justify-between w-full rounded-md border border-[#E8DCC9] border-dashed bg-[#FAF5EC] px-3 py-2 text-sm text-[#5F5A54] hover:bg-[#E8DCC9] hover:text-[#5F5A54] hover:border-slate-300 cursor-pointer transition-colors"
                  onClick={() => {
                    setParentForNew(currentParentId || "");
                    setIsModalOpen(true);
                  }}
                >
                  <span>No subcategories yet.</span>
                  <span className="text-primary font-medium">+ Add New</span>
                </div>
            </div>
           );
           break;
       }
       continue;
    }

    currentParentId = selectedValue;
    level++;
  }

  return (
    <div className="space-y-3">
      {levelsToRender}
      {error && <p className="text-xs text-[#B94A48]">{error}</p>}
      
      {isModalOpen && (
        <CategoryFormModal
          category={null}
          categories={allCategories}
          onClose={() => setIsModalOpen(false)}
          defaultParentId={parentForNew}
        />
      )}
    </div>
  );
}
