require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: userAuth, error: createErr } = await supabase.auth.admin.createUser({
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    email_confirm: true
  });
  
  if (createErr) return console.error(createErr);
  
  const user = userAuth.user;

  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: 'password123'
  });
  
  if (error) return console.error(error);

  const { data: product } = await supabase.from('products').select('*').limit(1).single();

  const res = await fetch('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      items: [{ product_id: product.id, quantity: 2 }],
      shippingDetails: { location: "Test", fullAddress: "Test Address", recipientName: "Test", recipientPhone: "123" },
      contactDetails: { fullName: "Test", userPhone: "123", userEmail: "test@example.com" },
      paymentMethod: 'M-Pesa'
    })
  });
  
  const json = await res.json();
  console.log("Checkout Res:", json);
}
run();
