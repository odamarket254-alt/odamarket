const fs = require('fs');
let content = fs.readFileSync('routes/checkoutRoutes.ts', 'utf8');
content = content.replace(/select\('id, title, regular_price, sale_price, stock'\)/g, "select('id, name, price, sale_price, wholesale_price, is_wholesale, wholesale_min_qty, stock')");
content = content.replace(/product\.title/g, "product.name");
content = content.replace(/product\.sale_price \|\| product\.regular_price/g, "product.sale_price || product.price");
fs.writeFileSync('routes/checkoutRoutes.ts', content);
