import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: w, error: oErr } = await supabase.from('wishlist_items').select('*');
  console.log("Wishlist items:", w?.length, oErr);
  const { data: c, error: cErr } = await supabase.from('cart_items').select('*');
  console.log("Cart items:", c?.length, cErr);
}
check();
