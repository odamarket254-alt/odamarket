const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    const { data } = await supabase.from('orders').select('*').limit(5);
    console.log("Order structure:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
run();
