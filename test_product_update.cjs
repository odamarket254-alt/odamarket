const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(url, key);

async function run() {
  const { data: user, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@odamarket.com',
    password: 'password123'
  }); // I don't know the password...
}
run();
