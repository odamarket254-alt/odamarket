import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { data: policies, error } = await supabaseAdmin.from('pg_policies').select('*');
    if (error) console.log("Error querying pg_policies", error);
    else console.log("Policies:", policies);
  } catch(e) {
    console.log(e);
  }
}
test();
