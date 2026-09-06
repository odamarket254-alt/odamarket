const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductsPage.tsx', 'utf8');
code = code.replace(/  \/\/ Subscribe to real-time products changes\s*useEffect\(\(\) => \{\s*const channel = return \(\) => \{\s*supabase\.removeChannel\(channel\);\s*\};\s*\}, \[\]\); \/\/ eslint-disable-line react-hooks\/exhaustive-deps\s*/g, '');
fs.writeFileSync('src/pages/ProductsPage.tsx', code);
