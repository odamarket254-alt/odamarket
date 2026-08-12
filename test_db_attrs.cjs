const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('products').select('attributes').limit(1);
  if (error) {
    console.error("DB Error:", error.message);
  } else {
    console.log("Success, data:", data);
  }
}
run();
