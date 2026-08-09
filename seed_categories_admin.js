import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Starting seed...');
  
  // 1. Make user admin
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  if (users?.users) {
      for (const u of users.users) {
          if (u.email === 'odamarket254@gmail.com') {
             const { error: updateErr } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', u.id);
             console.log(`Updated user ${u.email} to admin`, updateErr || 'Success');
          }
      }
  }

  // 2. Create categories
  const categories = [
    { name: 'Electronics', slug: 'electronics', is_active: true },
    { name: 'Fashion', slug: 'fashion', is_active: true },
    { name: 'Home & Kitchen', slug: 'home-kitchen', is_active: true },
    { name: 'Beauty', slug: 'beauty', is_active: true },
    { name: 'Groceries', slug: 'groceries', is_active: true }
  ];

  const { data: catData, error: catErr } = await supabase.from('categories').upsert(categories, { onConflict: 'slug' }).select();
  if (catErr) console.error('Categories Error:', catErr);
  else console.log('Categories seeded:', catData.length);

  console.log('Done.');
}

run();
