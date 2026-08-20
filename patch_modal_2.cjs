const fs = require('fs');
let code = fs.readFileSync('src/components/admin/orders/OrderDetailsModal.tsx', 'utf8');

code = code.replace(
  /order\.id\.split\('-'\)\[0\]\.toUpperCase\(\)/g,
  "order?.id?.split('-')?.[0]?.toUpperCase() || 'UNKNOWN'"
);

code = code.replace(
  /format\(new Date\(order\.created_at\), 'PPP p'\)/g,
  "order?.created_at ? format(new Date(order.created_at), 'PPP p') : 'Unknown Date'"
);

fs.writeFileSync('src/components/admin/orders/OrderDetailsModal.tsx', code);
