import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  console.log("Users:", users?.users.length, uErr);
  
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log("Profiles:", profiles?.length, pErr);
  
  if (users?.users) {
      for (const u of users.users) {
          const p = profiles?.find(p => p.id === u.id);
          console.log(`User ${u.email}: has profile = ${!!p}`);
          if (p) console.log(`  Role: ${p.role}`);
      }
  }
}
check();
