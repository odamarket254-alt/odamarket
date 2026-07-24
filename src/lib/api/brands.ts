import { supabase } from '../supabase';
import { Brand } from '../../types/brand';

export async function getBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
  return data as Brand[];
}

export async function getBrand(id: string) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Brand;
}

export async function createBrand(brand: Partial<Brand>) {
  const { data, error } = await supabase
    .from('brands')
    .insert([brand])
    .select()
    .single();
  if (error) throw error;
  return data as Brand;
}

export async function updateBrand(id: string, brand: Partial<Brand>) {
  const { data, error } = await supabase
    .from('brands')
    .update(brand)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Brand;
}

export async function deleteBrand(id: string) {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function bulkUpdateBrands(updates: { id: string; changes: Partial<Brand> }[]) {
  const promises = updates.map(u => 
    supabase.from('brands').update(u.changes).eq('id', u.id)
  );
  await Promise.all(promises);
}
