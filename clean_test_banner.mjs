import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data: section } = await supabase.from('homepage_sections').select('*').eq('type', 'hero_banner').single();
  const currentBanners = section.content?.banners || [];
  const cleanedBanners = currentBanners.filter(b => b.id !== "random-1234");
  
  await supabase
    .from('homepage_sections')
    .update({ content: { ...section.content, banners: cleanedBanners } })
    .eq('id', section.id);
  console.log("Cleaned test banner");
}
test();
