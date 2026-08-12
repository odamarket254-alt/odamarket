const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: o } = await supabase.from('orders').select('*').limit(0);
  const { data: p } = await supabase.from('payment_records').select('*').limit(0);
  console.log('orders:', Object.keys(o?.[0] || {}).length ? Object.keys(o[0]) : 'empty or hidden');
  console.log('payment_records:', Object.keys(p?.[0] || {}).length ? Object.keys(p[0]) : 'empty or hidden');
}
run();
