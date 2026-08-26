import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Create a dummy user
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: 'test_product_reader@example.com',
    password: 'password123',
    email_confirm: true
  });
  
  if (authErr && !authErr.message.includes('already registered')) {
    console.log("Failed to create user:", authErr);
    return;
  }
  
  const supabaseAnon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  await supabaseAnon.auth.signInWithPassword({ email: 'test_product_reader@example.com', password: 'password123' });
  
  const { data, error } = await supabaseAnon
        .from("products")
        .select('*, category:categories!left(name), brands(name)')
        .eq("id", "2f0688a2-d7f4-4d10-84e2-df17629f8502")
        .single();
        
  console.log("Authenticated User Data:", data ? "Found" : "Null", "Error:", error);
  
  // Cleanup
  if (authData?.user?.id) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
  }
}
test();
