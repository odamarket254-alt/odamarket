const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix stats state
  content = content.replace(
    /const \[stats, setStats\] = useState\(\{ total: 0, active: 0, draft: 0, archived: 0, outOfStock: 0, lowStock: 0, wholesale: 0 \}\);/,
    "const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, archived: 0, outOfStock: 0, lowStock: 0, wholesale: 0 });"
  ); // Wait, if I just add wholesale to setStats it's easier
  
  content = content.replace(
    /lowStock: lowReq\.count \|\| 0\n\s*\}\);/,
    "lowStock: lowReq.count || 0,\n        wholesale: 0\n      });"
  );
  
  // Fix query order in wholesale page
  if (file.includes('AdminWholesaleProductsPage')) {
    content = content.replace(
      /let query = supabase\n\s*\.from\('products'\)\n\s*\.eq\('is_wholesale', true\)\n\s*\.select\('\*, category:categories!left\(name\), brand:brands!left\(name\)', \{ count: 'exact' \}\);/,
      "let query = supabase.from('products').select('*, category:categories!left(name), brand:brands!left(name)', { count: 'exact' }).eq('is_wholesale', true);"
    );
  }
  
  fs.writeFileSync(file, content);
}

fix('src/pages/admin/AdminProductsPage.tsx');
fix('src/pages/admin/AdminWholesaleProductsPage.tsx');
console.log("Fixed lint errors");
