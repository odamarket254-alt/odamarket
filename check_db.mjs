import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data } = await supabase.from('homepage_sections').select('*').eq('type', 'hero_banner');
  console.log(`There are ${data.length} hero_banner sections in the DB.`);
}
test();
