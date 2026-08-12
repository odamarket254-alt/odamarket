const { createClient } = require('@supabase/supabase-js');
const url = "https://vjzgqhsvgknmnjpaefvy.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqemdxaHN2Z2tubW5qcGFlZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIxODc0MiwiZXhwIjoyMDk0Nzk0NzQyfQ.2Ck8Q1Ja6yzmonBuu2LcqPGCM601JPPgiKNpm2e0RjI";
const supabase = createClient(url, key);

async function run() {
  const { data: cat } = await supabase.from('categories').select('id').limit(1);
  if (!cat || !cat.length) return console.log('no categories');
  
  const productData = {
    name: 'Test Product',
    slug: 'test-product-' + Date.now(),
    price: 100,
    stock: 10,
    category_id: cat[0].id,
    is_active: true,
    is_public: true,
    is_wholesale: true,
    wholesale_price: 90,
    wholesale_min_qty: 10,
    wholesale_unit: 'box'
  };
  
  const { data, error } = await supabase.from('products').insert([productData]).select();
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data[0].id);
    await supabase.from('products').delete().eq('id', data[0].id);
  }
}
run();
