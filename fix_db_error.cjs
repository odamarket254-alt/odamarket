const fs = require('fs');

function fixForm(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/is_featured: data\.is_featured,/g, '// is_featured: data.is_featured, // UNCOMMENT AFTER RUNNING MIGRATION 20260101000009');
  content = content.replace(/is_new_arrival: data\.is_new_arrival,/g, '// is_new_arrival: data.is_new_arrival,');
  content = content.replace(/is_flash_sale: data\.is_flash_sale,/g, '// is_flash_sale: data.is_flash_sale,');
  content = content.replace(/is_best_deal: data\.is_best_deal,/g, '// is_best_deal: data.is_best_deal,');
  content = content.replace(/is_lowest_price: data\.is_lowest_price,/g, '// is_lowest_price: data.is_lowest_price,');
  content = content.replace(/is_electronics_zone: data\.is_electronics_zone,/g, '// is_electronics_zone: data.is_electronics_zone,');
  fs.writeFileSync(file, content);
  console.log('Fixed ' + file);
}

fixForm('src/pages/admin/AdminProductFormPage.tsx');
fixForm('src/pages/admin/AdminWholesaleProductFormPage.tsx');

function fixGrid(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/query = query\.eq\('is_new_arrival', true\)/g, '// query = query.eq(\'is_new_arrival\', true)');
  content = content.replace(/query = query\.eq\('is_featured', true\)/g, '// query = query.eq(\'is_featured\', true)');
  content = content.replace(/query = query\.eq\('is_flash_sale', true\)/g, '// query = query.eq(\'is_flash_sale\', true)');
  content = content.replace(/query = query\.eq\('is_best_deal', true\)/g, '// query = query.eq(\'is_best_deal\', true)');
  content = content.replace(/query = query\.eq\('is_lowest_price', true\)/g, '// query = query.eq(\'is_lowest_price\', true)');
  content = content.replace(/query = query\.eq\('is_electronics_zone', true\)/g, '// query = query.eq(\'is_electronics_zone\', true)');
  fs.writeFileSync(file, content);
  console.log('Fixed ' + file);
}

fixGrid('src/components/home/sections/ProductGridSection.tsx');
