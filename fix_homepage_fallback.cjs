const fs = require('fs');

let content = fs.readFileSync('src/components/home/DynamicHomepage.tsx', 'utf8');

const fallbackSections = `        // Fallback layout based on exact requirements
        setSections([
          { id: 'fallback-hero', type: 'hero_banner', name: 'Welcome', is_active: true, sort_order: 1, settings: {} },
          { id: 'fallback-categories', type: 'category_grid', name: 'Top Categories', title: 'Top Categories', is_active: true, sort_order: 2, settings: {} },
          { id: 'fallback-featured', type: 'featured_products', name: 'Featured Products', title: 'Featured Products', is_active: true, sort_order: 3, settings: {} },
          { id: 'fallback-flash', type: 'flash_deals', name: 'Flash Sales', title: 'Flash Sales', is_active: true, sort_order: 4, settings: {} },
          { id: 'fallback-best-deals', type: 'best_deals', name: 'Best Deals of the Week', title: 'Best Deals of the Week', is_active: true, sort_order: 5, settings: {} },
          { id: 'fallback-promo', type: 'promotional_banner', name: 'Promotional Banner', is_active: true, sort_order: 6, settings: {} },
          { id: 'fallback-wholesale', type: 'wholesale_products', name: 'Wholesale Products', title: 'Wholesale Products', is_active: true, sort_order: 7, settings: {} },
          { id: 'fallback-lowest', type: 'lowest_price', name: 'Lowest Price Everyday', title: 'Lowest Price Everyday', is_active: true, sort_order: 8, settings: {} },
          { id: 'fallback-electronics', type: 'electronics_zone', name: 'Electronics Zone', title: 'Electronics Zone', is_active: true, sort_order: 9, settings: {} }
        ] as HomepageSection[]);`;

content = content.replace(
  /\/\/ Fallback layout when there are no sections configured in the DB[\s\S]*?\] as HomepageSection\[\]\);/,
  fallbackSections
);

fs.writeFileSync('src/components/home/DynamicHomepage.tsx', content);
console.log("Fixed DynamicHomepage fallback");
