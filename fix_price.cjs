const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

// Also inject wholesale setting in pricing fields array
content = content.replace(
  /fields: \['regular_price', 'sale_price', 'cost_price', 'tax_class'\]/,
  "fields: ['regular_price', 'sale_price', 'cost_price', 'tax_class', 'is_wholesale', 'wholesale_price', 'wholesale_min_qty', 'wholesale_unit']"
);

// Map price to regular_price when fetching
content = content.replace(
  /setValue\(key as any, data\[key\] === null \? undefined : data\[key\]\);/,
  `if (key === 'price') setValue('regular_price', data[key]);\n          else setValue(key as any, data[key] === null ? undefined : data[key]);`
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', content);
