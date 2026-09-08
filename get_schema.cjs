require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reviews';" });
  if (error) {
     console.log("RPC Error:", error.message);
     // If exec_sql doesn't exist, we can't do this easily. We can insert a dummy and see error, or just guess based on AdminReviewsPage
  } else {
     console.log(data);
  }
}
run();
