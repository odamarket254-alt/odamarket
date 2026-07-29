const fs = require('fs');

const files = [
  'src/components/admin/dashboard/RecentOrders.tsx',
  'src/pages/admin/AdminInventoryPage.tsx',
  'src/pages/admin/AdminOrdersPage.tsx',
  'src/pages/admin/AdminAuditPage.tsx',
  'src/pages/admin/AdminRFQsPage.tsx',
  'src/pages/admin/AdminProductsPage.tsx',
  'src/pages/dashboard/UsersPage.tsx',
  'src/pages/dashboard/AdminOrdersPage.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Let's find exactly `<table className=` and replace if it's not preceded by `<div className="overflow-x-auto[^>]*>\s*<table`
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<table') && !lines[i-1]?.includes('overflow-x-auto') && !lines[i].includes('overflow-x-auto')) {
      lines[i] = lines[i].replace(/<table/g, '<div className="overflow-x-auto min-w-full"><table');
    }
    if (lines[i].includes('</table>')) {
      // only replace if we actually added the wrapper in this file!
      // simplest is to replace </table> with </table></div> for each <table that was modified.
      // But to be safe I will just use a regex on the whole file.
    }
  }
});
