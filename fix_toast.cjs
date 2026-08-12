const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

content = content.replace(
  /toast\.error\(`Failed: \$\{error\.message \|\| JSON\.stringify\(error\)\}`\);/,
  "toast.error(`Failed: ${error.message} - ${error.details || ''} - ${error.hint || ''}`);"
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', content);
