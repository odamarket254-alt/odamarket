const fs = require('fs');
let file = 'src/pages/admin/AdminProductFormPage.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/setValue\('is_wholesale', data\.wholesale_price != null\);/, "setValue('is_wholesale', !!data.is_wholesale);");
fs.writeFileSync(file, content);

let file2 = 'src/pages/admin/AdminWholesaleProductFormPage.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/setValue\('is_wholesale', data\.wholesale_price != null\);/, "setValue('is_wholesale', !!data.is_wholesale);");
fs.writeFileSync(file2, content2);
console.log("Fixed is_wholesale setValue");
