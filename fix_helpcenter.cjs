const fs = require('fs');
let code = fs.readFileSync('src/pages/HelpCenterPage.tsx', 'utf8');

code = code.replace(
  'description: formData.description,\n          status: \'Open\',',
  'description: formData.description,\n          message: formData.description,\n          status: \'Open\','
);

fs.writeFileSync('src/pages/HelpCenterPage.tsx', code);
console.log("Fixed HelpCenterPage.tsx");
