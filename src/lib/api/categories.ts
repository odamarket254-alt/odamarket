import { supabase } from '../supabase';
import { Category } from '../../types/category';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
    
  if (error) {
    console.error('Error fetching categories:', error);
    // Return empty if table doesn't exist yet to prevent crashes
    return [];
  }
  return data as Category[];
}

export async function getCategory(id: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Category;
}

export async function createCategory(category: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, category: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function bulkUpdateCategories(updates: { id: string; changes: Partial<Category> }[]) {
  // Supabase doesn't have a true bulk update RPC by default, so we'll run them in parallel
  // In a real enterprise system, we'd use a postgres function for this.
  const promises = updates.map(u => 
    supabase.from('categories').update(u.changes).eq('id', u.id)
  );
  await Promise.all(promises);
}
