const fs = require('fs');
let content = fs.readFileSync('src/components/home/WholesaleSection.tsx', 'utf8');

// Update ProductCard usage
content = content.replace(
  /              <ProductCard \n                product=\{\{\n                  \.\.\.product,\n                  price: product\.wholesale_price \|\| product\.price, \/\/ Override price with wholesale_price\n                \}\} \n              \/>/,
  `              <ProductCard 
                product={{
                  ...product,
                  id: product.id + '_wholesale',
                  name: product.name + ' (Wholesale)',
                  price: product.wholesale_price || product.price, // Override price with wholesale_price
                }} 
              />`
);

fs.writeFileSync('src/components/home/WholesaleSection.tsx', content);
