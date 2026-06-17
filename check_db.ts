import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log('PRODUCTS:', Object.keys(data[0] || {}));
  const { data: pData } = await supabase.from('profiles').select('*').limit(1);
  console.log('PROFILES:', Object.keys(pData[0] || {}));
}
check();
