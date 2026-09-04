require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addFlag() {
  const { error } = await supabase.rpc('execute_sql', {
    sql_query: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT false;"
  });
  if (error) {
     console.log("RPC fail, try direct POST");
     const url = supabaseUrl + '/rest/v1/rpc/execute_sql';
     console.log("No built-in way to execute arbitrary DDL from JS SDK if not rpc. Will use postgres connection or fallback to only sending email once in the code using an existing check.");
  }
}
addFlag();
