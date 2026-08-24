import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function seed() {
  const sections = [
    { title: 'Featured Products', type: 'featured_products', is_active: true, sort_order: 1, content: { layout: 'carousel', max_products: 10 } },
    { title: 'Flash Sales', type: 'flash_deals', is_active: true, sort_order: 2, content: { layout: 'carousel', max_products: 10 } },
    { title: 'Best Deals of the Week', type: 'best_deals', is_active: true, sort_order: 3, content: { layout: 'carousel', max_products: 10 } },
    { title: 'New Arrivals', type: 'new_arrivals', is_active: true, sort_order: 4, content: { layout: 'carousel', max_products: 10 } },
    { title: 'Wholesale Products', type: 'wholesale_products', is_active: true, sort_order: 5, content: { layout: 'carousel', max_products: 10 } },
    { title: 'Lowest Price Everyday', type: 'lowest_price', is_active: true, sort_order: 6, content: { layout: 'carousel', max_products: 10 } },
    { title: 'Electronics Zone', type: 'electronics_zone', is_active: true, sort_order: 7, content: { layout: 'carousel', max_products: 10 } },
  ];
  const { data: existing } = await supabase.from('homepage_sections').select('type');
  const existingTypes = new Set(existing.map(s => s.type));
  const toInsert = sections.filter(s => !existingTypes.has(s.type));
  if (toInsert.length > 0) {
    const { error } = await supabase.from('homepage_sections').insert(toInsert);
    console.log('Inserted:', toInsert.length, error);
  } else {
    console.log('Already seeded');
  }
}
seed();
