require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: i, error: e2 } = await supabase.from('order_items').select('*').limit(1);
  console.log("Items:", e2 || Object.keys(i[0] || {}));
}
run();
