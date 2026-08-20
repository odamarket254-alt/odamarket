import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data: o, error } = await supabase.from('orders').select('*');
  console.log("Raw orders:", o?.length, error);

  const { data: o2, error: e2 } = await supabase.from('orders').select(`
    *,
    customer:profiles!user_id(id, first_name, last_name, email, phone)
  `);
  console.log("With profiles inner join:", o2?.length, e2);
  
  const { data: o3, error: e3 } = await supabase.from('orders').select(`
    *,
    customer:profiles!left(id, first_name, last_name, email, phone)
  `);
  console.log("With profiles left join (guess 1):", o3?.length, e3);
  
  const { data: o4, error: e4 } = await supabase.from('orders').select(`
    *,
    profiles(id, first_name, last_name, email, phone)
  `);
  console.log("With profiles standard join (guess 2):", o4?.length, e4);
}
test();
