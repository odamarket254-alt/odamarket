import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { count: orders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: products } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log({ orders, products });
}
check();
