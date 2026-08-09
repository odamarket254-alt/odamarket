import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const adminSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: { user }, error: signupError } = await supabase.auth.signUp({
    email: 'test_admin_2@example.com',
    password: 'password123'
  });
  console.log('Signup User:', user?.id, signupError);

  if (user) {
    const { error: updateError } = await adminSupabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    console.log('Update Role Error:', updateError);

    // login
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'test_admin_2@example.com',
        password: 'password123'
    });
    console.log('Login Error:', loginError);

    if (session) {
      // simulate fetchProfile
      const { data, error } = await supabase
        .from("profiles")
        .select('*').limit(100)
        .eq("id", user.id)
        .single();
      console.log('Profile Fetch Error:', error);
      console.log('Profile Data:', data);
    }
  }
}
run();
