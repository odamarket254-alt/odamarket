import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = 'test_generate_link@example.com';
  // Create user
  await supabase.auth.admin.createUser({ email, password: 'password123', email_confirm: false });
  // Generate link
  const res = await supabase.auth.admin.generateLink({ type: 'signup', email, password: 'password123' });
  console.log(res);
}
run();
