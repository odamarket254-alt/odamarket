const fs = require('fs');

let content = fs.readFileSync('src/components/home/WholesaleSection.tsx', 'utf8');

content = content.replace(
  /\.not\('wholesale_price', 'is', null\)/,
  `.eq('is_wholesale', true)`
);

fs.writeFileSync('src/components/home/WholesaleSection.tsx', content);
console.log("Fixed WholesaleSection");
