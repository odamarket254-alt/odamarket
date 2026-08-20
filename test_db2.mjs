import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data: p } = await supabase.from('profiles').select('*').limit(1);
  console.log("Profile columns:", Object.keys(p?.[0] || {}));
}
test();
