const fs = require('fs');

const file = 'src/components/home/DynamicHomepage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the fallback array
content = content.replace(
  /setSections\(\[\s*\{ id: 'fallback-hero'[\s\S]*?\] as HomepageSection\[\]\);/,
  `setSections([
          { id: 'fallback-hero', type: 'hero_banner', name: 'Welcome', is_active: true, sort_order: 1, settings: {} },
          { id: 'fallback-categories', type: 'category_grid', name: 'Top Categories', title: 'Top Categories', is_active: true, sort_order: 2, settings: {} },
          { id: 'fallback-featured', type: 'featured_products', name: 'Featured Products', title: 'Featured Products', is_active: true, sort_order: 3, settings: {} },
          { id: 'fallback-flash', type: 'flash_deals', name: 'Flash Sales', title: 'Flash Sales', is_active: true, sort_order: 4, settings: {} },
          { id: 'fallback-best-deals', type: 'best_deals', name: 'Best Deals of the Week', title: 'Best Deals of the Week', is_active: true, sort_order: 5, settings: {} },
          { id: 'fallback-promo', type: 'promotional_banner', name: 'Promotional Banner', is_active: true, sort_order: 6, settings: {} },
          { id: 'fallback-new-arrivals', type: 'new_arrivals', name: 'New Arrivals', title: 'New Arrivals', is_active: true, sort_order: 7, settings: {} },
          { id: 'fallback-wholesale', type: 'wholesale_products', name: 'Wholesale Products', title: 'Wholesale Products', is_active: true, sort_order: 8, settings: {} },
          { id: 'fallback-lowest', type: 'lowest_price', name: 'Lowest Price Everyday', title: 'Lowest Price Everyday', is_active: true, sort_order: 9, settings: {} },
          { id: 'fallback-electronics', type: 'electronics_zone', name: 'Electronics Zone', title: 'Electronics Zone', is_active: true, sort_order: 10, settings: {} }
        ] as HomepageSection[]);`
);

// Remove the injection logic
content = content.replace(
  /\/\/ Inject Wholesale Products after index 5[\s\S]*?return \(\s*<React\.Fragment key=\{section\.id\}>\s*\{renderContent\(\)\}\s*\{isAfterPromotionalBanner && <WholesaleSection \/>\}\s*<\/React\.Fragment>\s*\);\s*\}/,
  `return (
          <React.Fragment key={section.id}>
            {renderContent()}
          </React.Fragment>
        );
      }`
);

fs.writeFileSync(file, content);
console.log("Fixed Homepage sections");
