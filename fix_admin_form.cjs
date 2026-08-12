const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

// Remove is_wholesale from the data sent to supabase
content = content.replace(
  /is_wholesale: data\.is_wholesale,/,
  "// is_wholesale: data.is_wholesale,"
);

// We should also initialize it based on whether wholesale_price exists
content = content.replace(
  /is_wholesale: data\.is_wholesale \|\| false,/,
  "is_wholesale: data.wholesale_price != null,"
);
// Or maybe it was initialized differently? Let's check init values

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', content);

console.log('Fixed admin form!');
