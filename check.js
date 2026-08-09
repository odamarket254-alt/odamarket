import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('homepage_sections').select('*');
  console.log('homepage_sections:', data);
  const { data: cat } = await supabase.from('categories').select('*').limit(5);
  console.log('categories:', cat);
}
run();
