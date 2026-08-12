const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

content = content.replace(
  /wholesale_price: data\.wholesale_price,/,
  "wholesale_price: data.is_wholesale ? data.wholesale_price : null,"
);

content = content.replace(
  /wholesale_min_qty: data\.wholesale_min_qty,/,
  "wholesale_min_qty: data.is_wholesale ? data.wholesale_min_qty : null,"
);

content = content.replace(
  /wholesale_unit: data\.wholesale_unit,/,
  "wholesale_unit: data.is_wholesale ? data.wholesale_unit : null,"
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', content);
