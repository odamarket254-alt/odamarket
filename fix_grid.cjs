const fs = require('fs');

let content = fs.readFileSync('src/components/home/sections/ProductGridSection.tsx', 'utf8');
content = content.replace(/\/\/ query = query\.eq\('is_new_arrival', true\)/g, "query = query.eq('is_new_arrival', true)");
content = content.replace(/\/\/ query = query\.eq\('is_featured', true\)/g, "query = query.eq('is_featured', true)");
content = content.replace(/\/\/ query = query\.eq\('is_flash_sale', true\)/g, "query = query.eq('is_flash_sale', true)");
content = content.replace(/\/\/ query = query\.eq\('is_best_deal', true\)/g, "query = query.eq('is_best_deal', true)");
content = content.replace(/\/\/ query = query\.eq\('is_lowest_price', true\)/g, "query = query.eq('is_lowest_price', true)");
content = content.replace(/\/\/ query = query\.eq\('is_electronics_zone', true\)/g, "query = query.eq('is_electronics_zone', true)");

fs.writeFileSync('src/components/home/sections/ProductGridSection.tsx', content);
