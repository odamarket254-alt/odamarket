import { supabase } from './src/lib/supabase.ts';
async function test() {
  const { data, error } = await supabase.from('categories').select('*');
  console.log("Categories:", data);
  console.log("Error:", error);
}
test();
