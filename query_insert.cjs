const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('homepage_sections').insert([
    {
      title: 'Shop / Categories',
      type: 'category_grid',
      content: { layout: 'grid' },
      is_active: true,
      sort_order: 1
    }
  ]).select();
  console.log("Insert result:", data, error);
  
  if (!error) {
    // shift the others down
    const { data: sections } = await supabase.from('homepage_sections').select('*');
    for (const s of sections) {
      if (s.type !== 'category_grid' && s.type !== 'hero_banner') {
        await supabase.from('homepage_sections').update({ sort_order: s.sort_order + 1 }).eq('id', s.id);
      }
    }
    console.log("Shifted other sections down.");
  }
}
run();
