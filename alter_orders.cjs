const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabaseAdmin.rpc('exec_sql', { query: `
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reference text;
  `});
  console.log("Alter response:", data, error);
}
run();
