const fs = require('fs');
let formPage = fs.readFileSync('src/pages/admin/AdminWholesaleProductFormPage.tsx', 'utf8');

formPage = formPage.replace(/AdminWholesaleWholesale ProductFormPage/g, 'AdminWholesaleProductFormPage');
// Any other weird naming issues?
fs.writeFileSync('src/pages/admin/AdminWholesaleProductFormPage.tsx', formPage);
console.log("Fixed form");
