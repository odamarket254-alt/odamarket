const { createClient } = require('@supabase/supabase-js');
const url = "https://vjzgqhsvgknmnjpaefvy.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqemdxaHN2Z2tubW5qcGFlZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIxODc0MiwiZXhwIjoyMDk0Nzk0NzQyfQ.2Ck8Q1Ja6yzmonBuu2LcqPGCM601JPPgiKNpm2e0RjI";
const supabaseAdmin = createClient(url, key);

// Generate custom JWT (Supabase doesn't let you easily generate a signed JWT without the JWT secret, but wait! We can just use supabase-js auth.admin.generateLink or similar... no, we don't have the password.
// But we can check policies.

async function run() {
  const { data: policies, error } = await supabaseAdmin.from('products').select('*').limit(1);
  console.log('Policies check: we need to find what policy is failing');
}
run();
