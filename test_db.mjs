import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data: section } = await supabase.from('homepage_sections').select('*').eq('type', 'hero_banner').single();
  const currentBanners = section.content?.banners || [];
  
  const newBanner = {
    id: "random-1234",
    title: "Realtime Test Banner",
    subtitle: "Testing realtime insertion",
    desktop_image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80",
    is_active: true,
    position: currentBanners.length
  };
  
  const { data, error } = await supabase
    .from('homepage_sections')
    .update({ content: { ...section.content, banners: [...currentBanners, newBanner] } })
    .eq('id', section.id)
    .select();
    
  console.log(error || "Success");
}
test();
