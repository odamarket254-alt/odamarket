import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log('Starting seed...');

  // 1. Create categories
  const categories = [
    { name: 'Electronics', slug: 'electronics', is_active: true },
    { name: 'Fashion', slug: 'fashion', is_active: true },
    { name: 'Home & Kitchen', slug: 'home-kitchen', is_active: true },
    { name: 'Beauty', slug: 'beauty', is_active: true }
  ];

  const { data: catData, error: catErr } = await supabase.from('categories').upsert(categories, { onConflict: 'slug' }).select();
  if (catErr) console.error('Categories Error:', catErr);

  // 2. Create Brands
  const brands = [
    { name: 'Samsung', slug: 'samsung' },
    { name: 'Apple', slug: 'apple' },
    { name: 'Sony', slug: 'sony' },
    { name: 'Nike', slug: 'nike' }
  ];
  const { data: brandData, error: brandErr } = await supabase.from('brands').upsert(brands, { onConflict: 'slug' }).select();
  if (brandErr) console.error('Brands Error:', brandErr);

  // 3. Create Products
  const products = [
    { 
      name: 'Samsung Galaxy S24 Ultra', 
      slug: 'samsung-galaxy-s24-ultra', 
      price: 150000, 
      stock: 45, 
      category_id: catData?.find(c => c.slug === 'electronics')?.id,
      brand_id: brandData?.find(b => b.slug === 'samsung')?.id,
      is_active: true,
      is_public: true
    },
    { 
      name: 'MacBook Pro 16" M3 Max', 
      slug: 'macbook-pro-16-m3', 
      price: 350000, 
      stock: 12,
      category_id: catData?.find(c => c.slug === 'electronics')?.id,
      brand_id: brandData?.find(b => b.slug === 'apple')?.id,
      is_active: true,
      is_public: true
    },
    { 
      name: 'Nike Air Max 2024', 
      slug: 'nike-air-max-2024', 
      price: 18000, 
      stock: 100,
      category_id: catData?.find(c => c.slug === 'fashion')?.id,
      brand_id: brandData?.find(b => b.slug === 'nike')?.id,
      is_active: true,
      is_public: true
    }
  ];

  const { data: prodData, error: prodErr } = await supabase.from('products').upsert(products, { onConflict: 'slug' }).select();
  if (prodErr) console.error('Products Error:', prodErr);

  const { data: profiles } = await supabase.from('profiles').select('*').limit(5);
  
  if (profiles && profiles.length > 0 && prodData) {
    const p1 = profiles[0].id;
    
    // Create Orders
    const orders = [
      {
        user_id: p1,
        status: 'delivered',
        subtotal: 150000,
        total: 150500,
        delivery_fee: 500,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
      },
      {
        user_id: p1,
        status: 'pending',
        subtotal: 18000,
        total: 18500,
        delivery_fee: 500,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
      },
      {
        user_id: p1,
        status: 'processing',
        subtotal: 350000,
        total: 350500,
        delivery_fee: 500,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ];

    const { data: orderData, error: orderErr } = await supabase.from('orders').insert(orders).select();
    if (orderErr) console.error('Orders Error:', orderErr);
    
    if (orderData) {
        const orderItems = [];
        orderData.forEach((order, index) => {
            const prod = prodData[index % prodData.length];
            orderItems.push({
                order_id: order.id,
                product_id: prod.id,
                product_name: prod.name,
                quantity: 1,
                unit_price: prod.price,
                total_price: prod.price
            });
        });
        await supabase.from('order_items').insert(orderItems);
    }
  }

  console.log('Seed completed.');
}

seed();
