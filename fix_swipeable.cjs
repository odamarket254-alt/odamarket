const fs = require('fs');
let content = fs.readFileSync('src/components/SwipeableProductCard.tsx', 'utf8');
content = content.replace(
  '{product.category?.name || product.categories?.name || "Uncategorized"}',
  '{typeof product.category === "string" ? product.category : product.categories?.name || "Uncategorized"}'
);
fs.writeFileSync('src/components/SwipeableProductCard.tsx', content);
console.log('Fixed src/components/SwipeableProductCard.tsx');
