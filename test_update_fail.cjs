require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('support_tickets').update({ resolved_at: new Date().toISOString() }).eq('id', 'c37daa32-694d-44b4-b206-419dcdaf3565');
  console.log("Error:", error);
}
run();
