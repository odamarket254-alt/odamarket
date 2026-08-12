const { createClient } = require('@supabase/supabase-js');
const url = "https://vjzgqhsvgknmnjpaefvy.supabase.co";
const key = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqemdxaHN2Z2tubW5qcGFlZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTg3NDIsImV4cCI6MjA5NDc5NDc0Mn0.8ReqQFgQf8OzOuV-ijs_x9gbQnLJw0alQpRmoJ3_nag";
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
  }
}
run();
