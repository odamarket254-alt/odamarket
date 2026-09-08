require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  let res = await supabase.from('reviews').select('*').limit(1);
  if (res.error) {
    res = await supabase.from('product_reviews').select('*').limit(1);
  }
  console.log("Reviews Table:", res.error || Object.keys(res.data[0] || {}));
}
run();
