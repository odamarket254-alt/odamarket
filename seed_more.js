import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Let's create more products, orders, and stats for the admin dashboard to look good.
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users?.users[0]?.id;

  if (userId) {
     const orders = [
      { user_id: userId, status: 'delivered', total: 5000, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString() },
      { user_id: userId, status: 'pending', total: 12000, created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
      { user_id: userId, status: 'processing', total: 3500, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { user_id: userId, status: 'delivered', total: 7000, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() }
    ];
    await supabase.from('orders').insert(orders);
    console.log("Seeded more orders.");
  }
}

run();
