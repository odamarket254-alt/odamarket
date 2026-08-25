const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('homepage_sections').select('content').eq('type', 'hero_banner');
  console.log(JSON.stringify(data, null, 2));
}
run();
