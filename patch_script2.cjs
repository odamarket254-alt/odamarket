const fs = require('fs');
let code = fs.readFileSync('src/components/home/sections/ProductGridSection.tsx', 'utf8');

const target = '      setIsLoading(false);\n    };\n    fetchProducts();';
code = code.replace(target, '      setIsLoading(false);\n      } catch (err) { console.error("err", err); setIsLoading(false); }\n    };\n    fetchProducts();');
fs.writeFileSync('src/components/home/sections/ProductGridSection.tsx', code);
