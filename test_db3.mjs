import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('orders').select(`
    *,
    customer:profiles(id, first_name, last_name, email, phone_number)
  `).limit(2);
  console.log("Orders with profiles:", data, error);
}
test();
