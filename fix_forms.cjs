const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\/\/ is_featured: data.is_featured, \/\/ UNCOMMENT AFTER RUNNING MIGRATION 20260101000009/g, "is_featured: data.is_featured,");
  content = content.replace(/\/\/ is_new_arrival: data.is_new_arrival,/g, "is_new_arrival: data.is_new_arrival,");
  content = content.replace(/\/\/ is_flash_sale: data.is_flash_sale,/g, "is_flash_sale: data.is_flash_sale,");
  content = content.replace(/\/\/ is_best_deal: data.is_best_deal,/g, "is_best_deal: data.is_best_deal,");
  content = content.replace(/\/\/ is_lowest_price: data.is_lowest_price,/g, "is_lowest_price: data.is_lowest_price,");
  content = content.replace(/\/\/ is_electronics_zone: data.is_electronics_zone,/g, "is_electronics_zone: data.is_electronics_zone,");
  fs.writeFileSync(file, content);
}

fixFile('src/pages/admin/AdminProductFormPage.tsx');
fixFile('src/pages/admin/AdminWholesaleProductFormPage.tsx');
