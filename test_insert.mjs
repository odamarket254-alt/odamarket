import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const newSection = {
    name: 'Hero Banners Test',
    title: 'Hero Banners Test',
    type: 'hero_banner',
    is_active: true,
    sort_order: 0,
    settings: { banners: [] }
  };
  const res = await supabase.from('homepage_sections').insert(newSection).select();
  console.log(res);
}
test();
