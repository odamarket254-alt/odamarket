const fs = require('fs');
let content = fs.readFileSync('src/pages/ProductDetailsPage.tsx', 'utf-8');
content = content.replace(
  /\.select\('\*, category:categories!left\(name\), brand:brands!left\(name\)'\)/g,
  ".select('*, category:categories!left(name), brands(name)')"
);
fs.writeFileSync('src/pages/ProductDetailsPage.tsx', content);
