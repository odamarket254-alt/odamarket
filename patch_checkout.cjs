const fs = require('fs');
let code = fs.readFileSync('routes/checkoutRoutes.ts', 'utf8');

code = code.replace(
  /\.select\('id, name, price, sale_price, wholesale_price, is_wholesale, wholesale_min_qty, stock'\)/,
  ".select('id, name, price, sale_price, wholesale_price, is_wholesale, wholesale_min_qty, stock, image_url')"
);

code = code.replace(
  /orderItems\.push\(\{\s+product_id:\s*product\.id,\s+product_name:\s*product\.name\s*\|\|\s*'Unknown Product',\s+quantity:\s*item\.quantity,\s+unit_price:\s*price,\s+total_price:\s*price\s*\*\s*item\.quantity\s*\}\);/,
  `orderItems.push({
        product_id: product.id,
        product_name: product.name || 'Unknown Product',
        product_image: product.image_url || '',
        quantity: item.quantity,
        unit_price: price,
        subtotal: price * item.quantity,
        total_price: price * item.quantity // Keep for backwards compatibility during migration
      });`
);

fs.writeFileSync('routes/checkoutRoutes.ts', code);
