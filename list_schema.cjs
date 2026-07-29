const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  console.log('orders columns:', data ? Object.keys(data[0] || {}) : error);
  const { data: items, error: ierr } = await supabase.from('order_items').select('*').limit(1);
  console.log('order_items columns:', items ? Object.keys(items[0] || {}) : ierr);
  const { data: p, error: perr } = await supabase.from('products').select('*').limit(1);
  console.log('products columns:', p ? Object.keys(p[0] || {}) : perr);
}
main();
