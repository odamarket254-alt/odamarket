const fs = require('fs');

// Fix WholesaleSection.tsx
let content = fs.readFileSync('src/components/home/WholesaleSection.tsx', 'utf8');
content = content.replace(/\.eq\('is_wholesale', true\)/, ".not('wholesale_price', 'is', null)");
fs.writeFileSync('src/components/home/WholesaleSection.tsx', content);

// Fix AdminProductsPage.tsx
let content2 = fs.readFileSync('src/pages/admin/AdminProductsPage.tsx', 'utf8');
content2 = content2.replace(/\.eq\('is_wholesale', true\)/g, ".not('wholesale_price', 'is', null)");
content2 = content2.replace(/product\.is_wholesale/g, "product.wholesale_price != null");
fs.writeFileSync('src/pages/admin/AdminProductsPage.tsx', content2);

// Fix ProductDetailsPage.tsx
let content3 = fs.readFileSync('src/pages/ProductDetailsPage.tsx', 'utf8');
content3 = content3.replace(/product\.is_wholesale/g, "product.wholesale_price != null");
fs.writeFileSync('src/pages/ProductDetailsPage.tsx', content3);

console.log('Patched wholesale fields!');
