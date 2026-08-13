const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (data && data[0]) {
    console.log("is_featured exists?", 'is_featured' in data[0]);
    console.log("is_new_arrival exists?", 'is_new_arrival' in data[0]);
  }
}
run();
