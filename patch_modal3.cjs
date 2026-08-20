const fs = require('fs');
let code = fs.readFileSync('src/components/admin/orders/OrderDetailsModal.tsx', 'utf8');

code = code.replace(
  /order\.customer\?\.phone/g,
  "order.customer?.phone_number"
);

fs.writeFileSync('src/components/admin/orders/OrderDetailsModal.tsx', code);
