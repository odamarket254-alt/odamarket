import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fix() {
  const { error: err1 } = await supabase.rpc('execute_sql', { sql_statement: "ALTER TABLE public.homepage_sections ADD COLUMN IF NOT EXISTS name TEXT;" });
  const { error: err2 } = await supabase.rpc('execute_sql', { sql_statement: "ALTER TABLE public.homepage_sections ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;" });
  const { error: err3 } = await supabase.rpc('execute_sql', { sql_statement: "NOTIFY pgrst, 'reload schema';" });
  console.log(err1, err2, err3);
}
fix();
