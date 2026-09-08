require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const p = await supabase.from('products').select('id').limit(1);
  const u = await supabase.from('profiles').select('id').limit(1);
  const { data, error } = await supabase.from('reviews').insert({ user_id: u.data[0].id, product_id: p.data[0].id, rating: 5, comment: 'test' }).select();
  console.log(error || data);
  if (data) {
     await supabase.from('reviews').delete().eq('id', data[0].id);
  }
}
run();
