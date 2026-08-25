const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await supabase.from('homepage_sections').select('*').eq('type', 'hero_banner').single();
  const content = data.content;
  content.banners = content.banners.map(b => {
    if (b.button_text === 'Shop Now' && b.button_link === '/') {
      b.button_link = '/products';
    }
    return b;
  });
  await supabase.from('homepage_sections').update({ content }).eq('type', 'hero_banner');
  console.log("Updated banner link");
}
run();
