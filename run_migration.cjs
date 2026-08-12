const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY // anon key might not have permission to run exec_sql if it's restricted, but let's try
);

async function run() {
  const sql = `
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_wholesale BOOLEAN DEFAULT false;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10, 2);
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_min_qty INTEGER DEFAULT 1;
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_unit TEXT;
  
  -- Force PostgREST to reload schema
  NOTIFY pgrst, 'reload schema';
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }); // wait, was it sql_query or sql? Let's try both.
  
  if (error) {
    console.error("RPC exec_sql failed with sql_query:", error.message);
    const { data: d2, error: e2 } = await supabase.rpc('exec_sql', { sql: sql });
    if (e2) {
      console.error("RPC exec_sql failed with sql:", e2.message);
      
      // Let's try inserting into a migrations table if exec_sql doesn't work?
      // Supabase SQL editor is not accessible here.
    } else {
      console.log("Success with sql:", d2);
    }
  } else {
    console.log("Success with sql_query:", data);
  }
}
run();
