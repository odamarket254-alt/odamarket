const fs = require('fs');
let code = fs.readFileSync('src/pages/HelpCenterPage.tsx', 'utf8');

code = code.replace(
  'order_id: formData.order_id,',
  'order_id: formData.order_id || null,'
);
code = code.replace(
  'customer_id: user?.id || null,',
  'customer_id: user?.id || null,'
);

fs.writeFileSync('src/pages/HelpCenterPage.tsx', code);
console.log("Fixed order_id in HelpCenterPage.tsx");
