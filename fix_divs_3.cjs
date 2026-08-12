const fs = require('fs');
function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /\{\/\* Homepage Visibility \*\/\}/,
    `</div>\n</div>\n                {/* Homepage Visibility */}`
  );
  fs.writeFileSync(file, content);
  console.log("Fixed " + file);
}
fixFile('src/pages/admin/AdminProductFormPage.tsx');
fixFile('src/pages/admin/AdminWholesaleProductFormPage.tsx');
