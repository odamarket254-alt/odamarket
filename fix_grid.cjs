const fs = require('fs');
let file = 'src/components/home/sections/ProductGridSection.tsx';
let content = fs.readFileSync(file, 'utf8');

let replace = `
        // Make sure we only show active products on the storefront
        query = query.eq('is_active', true);

        // Homepage Placement Filters based on section type
        switch (section.type) {
          case 'new_arrivals':
          case 'recently_restocked':
            query = query.eq('is_new_arrival', true).order('created_at', { ascending: false });
            break;
          case 'featured_products':
          case 'featured':
            query = query.eq('is_featured', true).order('created_at', { ascending: false });
            break;
          case 'flash_sales':
          case 'flash_deals':
          case 'sale':
            query = query.eq('is_flash_sale', true).order('created_at', { ascending: false });
            break;
          case 'best_deals':
          case 'deal_of_the_day':
            query = query.eq('is_best_deal', true).order('created_at', { ascending: false });
            break;
          case 'wholesale':
          case 'wholesale_products':
            query = query.eq('is_wholesale', true).order('created_at', { ascending: false });
            break;
          case 'lowest_price':
            query = query.eq('is_lowest_price', true).order('price', { ascending: true });
            break;
          case 'electronics_zone':
          case 'electronics':
            query = query.eq('is_electronics_zone', true).order('created_at', { ascending: false });
            break;
          case 'best_sellers':
          case 'trending':
          case 'top_rated':
            query = query.order('created_at', { ascending: true }); // Fallback
            break;
          case 'limited_stock':
            query = query.gt('stock', 0).lte('stock', 10).order('stock', { ascending: true });
            break;
`;

content = content.replace(
  /\/\/ Homepage Placement Filters based on section type[\s\S]*?case 'limited_stock':[\s\S]*?break;/,
  replace.trim()
);

fs.writeFileSync(file, content);
console.log("Fixed grid");
