const fs = require('fs');

let code = fs.readFileSync('src/pages/ProductsPage.tsx', 'utf8');
code = code.replace(/supabase\s*\.channel\([^)]+\)\s*\.on\('postgres_changes'[\s\S]*?\.subscribe\(\);\s*/g, '');
fs.writeFileSync('src/pages/ProductsPage.tsx', code);
