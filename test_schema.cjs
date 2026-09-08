require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  let { data, error } = await supabase.from('products').select('*').limit(1);
  console.log("Products:", error || Object.keys(data[0] || {}));
}
run();
