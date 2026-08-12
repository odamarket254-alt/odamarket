const fs = require('fs');
let content = fs.readFileSync('src/components/products/ProductCard.tsx', 'utf8');

content = content.replace(
  /const categoryName = product\.product_type\?\.name \|\| "Groceries";/,
  `const categoryName = product.category?.name || product.categories?.name || "Uncategorized";`
);

fs.writeFileSync('src/components/products/ProductCard.tsx', content);
console.log("Fixed ProductCard fallback");
