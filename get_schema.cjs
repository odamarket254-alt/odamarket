const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.rpc('get_schema_info'); // No we don't have rpc
  // Let's try to select 'attributes' explicitly
  const { data: d2, error: e2 } = await supabase.from('products').select('attributes').limit(1);
  console.log(e2 || d2);
}
run();
