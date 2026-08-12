const fs = require('fs');
function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /\{\/\* Next\/Prev Navigation \*\/\}/,
    `</div>\n</div>\n            {/* Next/Prev Navigation */}`
  );
  fs.writeFileSync(file, content);
  console.log("Fixed " + file);
}
fixFile('src/pages/admin/AdminProductFormPage.tsx');
fixFile('src/pages/admin/AdminWholesaleProductFormPage.tsx');
