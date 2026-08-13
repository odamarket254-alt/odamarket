const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: userAuth } = await supabase.auth.admin.createUser({
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    email_confirm: true
  });
  
  const user = userAuth.user;
  
  // Create a JWT token for the user manually
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: 'password123'
  });
  
  const { data: product } = await supabase.from('products').select('*').limit(1).single();
  
  const res = await fetch('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      items: [{ product_id: product.id, quantity: 2 }],
      shippingDetails: { location: "Test", fullAddress: "Test Address" },
      contactDetails: {},
      paymentMethod: 'M-Pesa'
    })
  });
  
  const json = await res.json();
  console.log("Checkout Res:", json);
  
  if (json.orderId) {
     const verifyRes = await fetch('http://localhost:3000/api/checkout/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: json.orderId
        })
      });
      const verifyJson = await verifyRes.json();
      console.log("Verify Res:", verifyJson);
  }
}
run();
