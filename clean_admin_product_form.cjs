const fs = require('fs');

// We need to hide/remove the wholesale fields from the main ProductForm
let formStr = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

// The wholesale fields block in JSX:
const jsxRegex = /<div className="flex items-start space-x-3 p-4 bg-\[#FAF5EC\]\/80 rounded-xl border border-\[#E8DCC9\] hover:bg-\[#FAF5EC\] transition-colors mb-4">[\s\S]*?<\/Label>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
// It's probably easier to just set `is_wholesale: false` and hide it in the UI. Or remove it entirely.
// Let's remove the whole toggle UI:
// We can just replace the whole thing.

formStr = formStr.replace(
  /<div className="flex items-start space-x-3 p-4 bg-\[#FAF5EC\]\/80 rounded-xl border border-\[#E8DCC9\] hover:bg-\[#FAF5EC\] transition-colors mb-4">[\s\S]*?<\/div>\s*<\/div>\s*\)\}/,
  ''
);

// We should also remove it from the Pricing tab array in fields
formStr = formStr.replace(
  /'tax_class', 'is_wholesale', 'wholesale_price', 'wholesale_min_qty', 'wholesale_unit'/,
  "'tax_class'"
);

// Ensure is_wholesale is saved as false for normal products:
formStr = formStr.replace(
  /is_wholesale: data\.is_wholesale,/,
  "is_wholesale: false,"
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', formStr);
console.log("Updated AdminProductFormPage.tsx to remove wholesale UI");
