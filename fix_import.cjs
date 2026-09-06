const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductsPage.tsx', 'utf8');
if (!code.includes('@tanstack/react-query')) {
  code = `import { useQuery } from "@tanstack/react-query";\n` + code;
  fs.writeFileSync('src/pages/ProductsPage.tsx', code);
}
