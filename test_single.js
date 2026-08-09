import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase
        .from("profiles")
        .select('*').limit(100)
        .eq("id", "4d4e877a-e835-4778-b165-a1edf7959165")
        .single();
  console.log('Error:', error);
  console.log('Profile:', data);
}
run();
