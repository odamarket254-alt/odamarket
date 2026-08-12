const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProductsPage.tsx', 'utf8');

// Update activeTab types
content = content.replace(
  /const \[activeTab, setActiveTab\] = useState\<'all' \| 'active' \| 'draft' \| 'archived' \| 'out_of_stock'\>\('all'\);/,
  "const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'archived' | 'out_of_stock' | 'wholesale'>('all');"
);

// Add wholesale to stats
content = content.replace(
  /const \[stats, setStats\] = useState\(\{ total: 0, active: 0, draft: 0, archived: 0, outOfStock: 0, lowStock: 0 \}\);/,
  "const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, archived: 0, outOfStock: 0, lowStock: 0, wholesale: 0 });"
);

// Update fetchStats to include wholesale
content = content.replace(
  /supabase\.from\('products'\)\.select\('id', \{ count: 'exact', head: true \}\)\.lte\('stock', 0\)/,
  `supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 0),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_wholesale', true)`
);

content = content.replace(
  /outOfStock: outOfStockRes\.count \|\| 0,/,
  `outOfStock: outOfStockRes.count || 0,
        wholesale: wholesaleRes.count || 0,`
);

content = content.replace(
  /const \[totalRes, activeRes, draftRes, archivedRes, outOfStockRes\] = await Promise\.all\(\[/,
  `const [totalRes, activeRes, draftRes, archivedRes, outOfStockRes, wholesaleRes] = await Promise.all([`
);

// Add activeTab query filter
content = content.replace(
  /\} else if \(activeTab === 'archived'\) \{\n\s*query = query\.eq\('is_public', false\);\n\s*\}/,
  `} else if (activeTab === 'archived') {
        query = query.eq('is_public', false);
      } else if (activeTab === 'wholesale') {
        query = query.eq('is_wholesale', true);
      }`
);

// Add tab to the UI
content = content.replace(
  /\{ id: 'out_of_stock', label: 'Out of Stock', count: stats\.outOfStock \}/,
  `{ id: 'out_of_stock', label: 'Out of Stock', count: stats.outOfStock },
                { id: 'wholesale', label: 'Wholesale', count: stats.wholesale }`
);

// Add badge to table UI
content = content.replace(
  /<div className="font-medium text-\[\#3A2418\] line-clamp-1">\{product\.name\}<\/div>/,
  `<div className="font-medium text-[#3A2418] line-clamp-1 flex items-center gap-2">
                            {product.name}
                            {product.is_wholesale && <span className="bg-[#B94A48] text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">Wholesale</span>}
                          </div>`
);

fs.writeFileSync('src/pages/admin/AdminProductsPage.tsx', content);
