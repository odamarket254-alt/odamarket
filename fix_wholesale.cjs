const fs = require('fs');
let content = fs.readFileSync('routes/checkoutRoutes.ts', 'utf8');
content = content.replace(
  "const price = product.sale_price || product.price;",
  "let price = product.sale_price || product.price;\n      if (product.is_wholesale && item.quantity >= (product.wholesale_min_qty || 1)) {\n        price = product.wholesale_price || price;\n      }"
);
fs.writeFileSync('routes/checkoutRoutes.ts', content);
