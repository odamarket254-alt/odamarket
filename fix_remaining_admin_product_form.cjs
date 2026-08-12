const fs = require('fs');
let formStr = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

// There might be leftovers
formStr = formStr.replace(
  /\{watch\('is_wholesale'\) && \([\s\S]*?<\/div>\s*\)\}/,
  ''
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', formStr);
