const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

content = content.replace(
  /else setValue\(key as any, data\[key\] === null \? undefined : data\[key\]\);/,
  `else setValue(key as any, data[key] === null ? undefined : data[key]);
        });
        
        setValue('is_wholesale', data.wholesale_price != null);`
);

// We need to handle removing the second `});` if the loop was already closed.
// Let's actually do it precisely.
