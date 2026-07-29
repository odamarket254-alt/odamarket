const fs = require('fs');
let code = fs.readFileSync('src/pages/SupplierProfilePage.tsx', 'utf8');
code = code.replace(/const\s+\}\s*\}, \[id\]\);/g, '}, [id]);');
fs.writeFileSync('src/pages/SupplierProfilePage.tsx', code);
