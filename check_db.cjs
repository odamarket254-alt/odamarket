const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('payments').select('*').limit(1);
  console.log('Payments Table:', error || data);
  const { data: o, error: oe } = await supabase.from('orders').select('*').limit(1);
  console.log('Orders Table:', oe || o);
}
run();
