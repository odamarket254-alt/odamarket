const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

content = content.replace(
  /          else setValue\(key as any, data\[key\] === null \? undefined : data\[key\]\);\n        \}\);\n/,
  `          else setValue(key as any, data[key] === null ? undefined : data[key]);
        });
        setValue('is_wholesale', data.wholesale_price != null);
`
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', content);
