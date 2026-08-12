const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

content = content.replace(
  /slug: data\.slug \|\| data\.name\.toLowerCase\(\)\.replace\(\/\[\^a-z0-9\]\+\/g, '-'\)\.replace\(\/\(\^-\|-\$\)\+\/g, ''\),/,
  "slug: data.slug || (data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 8)),"
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', content);
