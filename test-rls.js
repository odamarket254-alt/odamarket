import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log("Service Role Data:", data ? "Found" : "Null", "Error:", error);

  const supabaseAnon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: d2, error: e2 } = await supabaseAnon.from('products').select('*').limit(1);
  console.log("Anon Data:", d2 ? "Found" : "Null", "Error:", e2);
}
test();
