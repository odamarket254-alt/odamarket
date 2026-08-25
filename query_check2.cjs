const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('homepage_sections').select('type, title, is_active, sort_order').order('sort_order', { ascending: true });
  console.table(data);
}
run();
