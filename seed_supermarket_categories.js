import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Starting to seed supermarket categories...');
  
  const categories = [
    { name: 'Fresh Produce', slug: 'fresh-produce', is_active: true },
    { name: 'Dairy & Eggs', slug: 'dairy-and-eggs', is_active: true },
    { name: 'Meat & Seafood', slug: 'meat-and-seafood', is_active: true },
    { name: 'Bakery & Bread', slug: 'bakery-and-bread', is_active: true },
    { name: 'Pantry & Dry Goods', slug: 'pantry-and-dry-goods', is_active: true },
    { name: 'Snacks & Candy', slug: 'snacks-and-candy', is_active: true },
    { name: 'Beverages', slug: 'beverages', is_active: true },
    { name: 'Frozen Foods', slug: 'frozen-foods', is_active: true },
    { name: 'Breakfast & Cereal', slug: 'breakfast-and-cereal', is_active: true },
    { name: 'Condiments & Spices', slug: 'condiments-and-spices', is_active: true },
    { name: 'Canned & Packaged Foods', slug: 'canned-and-packaged', is_active: true },
    { name: 'Personal Care', slug: 'personal-care', is_active: true },
    { name: 'Household & Cleaning', slug: 'household-and-cleaning', is_active: true },
    { name: 'Baby Care', slug: 'baby-care', is_active: true },
    { name: 'Pet Care', slug: 'pet-care', is_active: true },
    { name: 'Health & Wellness', slug: 'health-and-wellness', is_active: true },
    { name: 'Deli & Prepared Foods', slug: 'deli-and-prepared', is_active: true },
    { name: 'Alcohol & Spirits', slug: 'alcohol-and-spirits', is_active: true }
  ];

  const { data: catData, error: catErr } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' })
    .select();

  if (catErr) {
    console.error('Categories Error:', catErr);
  } else {
    console.log(`Successfully seeded ${catData.length} supermarket categories.`);
  }
}

run();
