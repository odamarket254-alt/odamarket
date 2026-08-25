const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("--- LATEST ORDERS (Admin) ---");
  const { data: latest } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }).limit(2);
  console.log(latest);
  
  console.log("--- COLUMNS ---");
  const { data: cols } = await supabaseAdmin.rpc('get_columns', { table_name: 'orders' }).catch(() => ({data: null}));
  console.log(cols); // Might fail if rpc doesn't exist
}
run();
