const { createClient } = require('@supabase/supabase-js');
const url = "https://vjzgqhsvgknmnjpaefvy.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqemdxaHN2Z2tubW5qcGFlZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIxODc0MiwiZXhwIjoyMDk0Nzk0NzQyfQ.2Ck8Q1Ja6yzmonBuu2LcqPGCM601JPPgiKNpm2e0RjI";
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return console.error(error);
  const user = data.users.find(u => u.email === 'odamarket254@gmail.com');
  console.log('User ID:', user ? user.id : 'not found');
  
  // Now let's try to update a product as this user
  // First, get a product
  const { data: prod } = await supabase.from('products').select('*').limit(1);
  if (!prod || !prod.length) return console.log('no products');
  
  // Insert a product using this user's id as seller_id to see if it bypasses RLS
  const productData = {
    name: 'Test Product User',
    slug: 'test-product-user-' + Date.now(),
    price: 100,
    stock: 10,
    category_id: prod[0].category_id,
    is_active: true,
    is_public: true,
    seller_id: user.id
  };
  
  const { data: ins, error: err } = await supabase.from('products').insert([productData]).select();
  if (err) {
    console.error('Insert as service role (w/ seller_id) Error:', err.message);
  } else {
    console.log('Insert w/ seller_id Success');
  }
}
run();
