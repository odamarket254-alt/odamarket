const fs = require('fs');
let content = fs.readFileSync('src/types/homepage.ts', 'utf8');
content = content.replace(
  "| 'custom_grid';",
  "| 'custom_grid'\n  | 'promotional_banner'\n  | 'wholesale_products'\n  | 'best_deals'\n  | 'lowest_price'\n  | 'electronics_zone'\n  | 'featured'\n  | 'flash_sales'\n  | 'sale'\n  | 'deal_of_the_day'\n  | 'wholesale'\n  | 'electronics';"
);
fs.writeFileSync('src/types/homepage.ts', content);
console.log('Fixed src/types/homepage.ts');
