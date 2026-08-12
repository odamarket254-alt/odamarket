const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/is_featured: data\.is_featured,/g, '');
  content = content.replace(/is_new_arrival: data\.is_new_arrival,/g, '');
  content = content.replace(/is_flash_sale: data\.is_flash_sale,/g, '');
  content = content.replace(/is_best_deal: data\.is_best_deal,/g, '');
  content = content.replace(/is_lowest_price: data\.is_lowest_price,/g, '');
  content = content.replace(/is_electronics_zone: data\.is_electronics_zone,/g, '');
  fs.writeFileSync(file, content);
  console.log("Fixed " + file);
}

fixFile('src/pages/admin/AdminProductFormPage.tsx');
fixFile('src/pages/admin/AdminWholesaleProductFormPage.tsx');

