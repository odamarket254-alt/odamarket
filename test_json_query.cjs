const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabaseAdmin.from('orders').select('*').ilike('notes', '%ORD-1787672619619-754%');
  console.log("ilike notes:", data?.length);
}
run();
