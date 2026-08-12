const fs = require('fs');

function fixSubmit(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /is_wholesale: false,/,
    'is_wholesale: data.is_wholesale,'
  );
  fs.writeFileSync(file, content);
}

fixSubmit('src/pages/admin/AdminProductFormPage.tsx');
fixSubmit('src/pages/admin/AdminWholesaleProductFormPage.tsx');
console.log("Fixed is_wholesale submit logic");
