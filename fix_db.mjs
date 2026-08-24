import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fix() {
  const { data: banners } = await supabase.from('homepage_sections').select('*').eq('type', 'hero_banner');
  if (banners.length > 1) {
    // Keep the one with content, delete the others
    const withContent = banners.find(b => b.content && b.content.banners && b.content.banners.length > 0);
    const toKeepId = withContent ? withContent.id : banners[0].id;
    
    for (const b of banners) {
      if (b.id !== toKeepId) {
        await supabase.from('homepage_sections').delete().eq('id', b.id);
        console.log(`Deleted duplicate hero banner section ${b.id}`);
      }
    }
  }
}
fix();
