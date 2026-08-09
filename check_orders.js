import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: orders, error: oErr } = await supabase.from('orders').select('*');
  console.log("Orders:", orders?.length, oErr);
}
check();
