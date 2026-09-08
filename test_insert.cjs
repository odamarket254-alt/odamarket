require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('reviews').insert({ user_id: '11111111-1111-1111-1111-111111111111', product_id: '11111111-1111-1111-1111-111111111111', rating: 5, comment: 'test' }).select();
  console.log(error || data);
}
run();
