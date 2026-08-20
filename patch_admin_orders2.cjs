const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/AdminOrdersPage.tsx', 'utf8');

code = code.replace(
  /customer:profiles!user_id\(id, first_name, last_name, email, phone\)/,
  "customer:profiles(id, first_name, last_name, email, phone_number)"
);

fs.writeFileSync('src/pages/dashboard/AdminOrdersPage.tsx', code);
