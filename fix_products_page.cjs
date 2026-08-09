const fs = require('fs');
const file = 'src/pages/admin/AdminProductsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix counts
content = content.replace(
  /\.eq\('status', 'active'\)/g,
  `.eq('is_active', true)`
);
content = content.replace(
  /\.eq\('status', 'draft'\)/g,
  `.eq('is_active', false).eq('is_public', true)`
);
content = content.replace(
  /\.eq\('status', 'archived'\)/g,
  `.eq('is_public', false)`
);

// Fix query filter
content = content.replace(
  /\} else if \(activeTab !== 'all'\) \{\n\s*query = query\.eq\('status', activeTab\);\n\s*\}/,
  `} else if (activeTab === 'active') {\n        query = query.eq('is_active', true);\n      } else if (activeTab === 'draft') {\n        query = query.eq('is_active', false).eq('is_public', true);\n      } else if (activeTab === 'archived') {\n        query = query.eq('is_public', false);\n      }`
);

// Fix bulk actions
content = content.replace(
  /\.update\(\{ status: 'archived' \}\)/g,
  `.update({ is_public: false, is_active: false })`
);
content = content.replace(
  /\.update\(\{ status: 'active' \}\)/g,
  `.update({ is_public: true, is_active: true })`
);

// Fix rendering
content = content.replace(
  /product\.status === 'active' \? "bg-\[\#E8DCC9\] text-\[\#C65A28\] border-emerald-200" :\n\s*product\.status === 'draft' \? "bg-\[\#D9A62E\]\/10 text-\[\#D9A62E\] border-amber-200" :\n\s*"bg-gray-100 text-gray-800 border-gray-200"\n\s*\}>\n\s*\{product\.status\}/g,
  `product.is_active ? "bg-[#E8DCC9] text-[#C65A28] border-emerald-200" :\n                        product.is_public ? "bg-[#D9A62E]/10 text-[#D9A62E] border-amber-200" :\n                        "bg-gray-100 text-gray-800 border-gray-200"\n                      }>\n                        {product.is_active ? 'active' : product.is_public ? 'draft' : 'archived'}`
);

fs.writeFileSync(file, content);
