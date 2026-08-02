const fs = require('fs');
let code = fs.readFileSync('src/components/home/sections/ProductGridSection.tsx', 'utf8');

code = code.replace(/const fetchProducts = async \(\) => { try {/g, 'const fetchProducts = async () => {');
code = code.replace(/setIsLoading\(false\); } catch \(e\) { console\.error\("Error in fetchProducts:", e\); setIsLoading\(false\); }/g, 'setIsLoading(false);');

// Now manually wrap
code = code.replace(
  'const fetchProducts = async () => {',
  'const fetchProducts = async () => {\n      try {'
);

code = code.replace(
  'setIsLoading(false);\n    };\n    fetchProducts();',
  'setIsLoading(false);\n      } catch (err) { console.error("Unhandled fetch error in ProductGrid", err); setIsLoading(false); }\n    };\n    fetchProducts();'
);

fs.writeFileSync('src/components/home/sections/ProductGridSection.tsx', code);
