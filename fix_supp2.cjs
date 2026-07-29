const fs = require('fs');
let code = fs.readFileSync('src/pages/SupplierProfilePage.tsx', 'utf8');
code = code.replace(/fetchSupplierDetails\(id\);\s+\}, \[id\]\);/g, 'fetchSupplierDetails(id);\n    }\n  }, [id]);');
fs.writeFileSync('src/pages/SupplierProfilePage.tsx', code);
