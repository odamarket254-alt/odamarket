const fs = require('fs');
let code = fs.readFileSync('src/pages/HelpCenterPage.tsx', 'utf8');

code = code.replace(
  ']).select().single();',
  ']);'
);

fs.writeFileSync('src/pages/HelpCenterPage.tsx', code);
console.log("Removed .select().single() from ticket submission");
