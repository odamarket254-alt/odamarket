const fs = require('fs');
let code = fs.readFileSync('src/components/admin/orders/OrderDetailsModal.tsx', 'utf8');

code = code.replace(
  /const contactDetails = order\.notes \? \(typeof order\.notes === 'string' \? JSON\.parse\(order\.notes\)\.contactDetails : order\.notes\.contactDetails\) : null;/,
  `let parsedNotes: any = null;
  try {
    parsedNotes = order.notes ? (typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes) : null;
  } catch (e) {
    console.error('Error parsing order notes:', e);
  }
  const contactDetails = parsedNotes?.contactDetails || null;`
);

code = code.replace(
  /const shippingDetails = order\.notes \? \(typeof order\.notes === 'string' \? JSON\.parse\(order\.notes\)\.shippingDetails : order\.notes\.shippingDetails\) : null;/,
  `const shippingDetails = parsedNotes?.shippingDetails || null;`
);

fs.writeFileSync('src/components/admin/orders/OrderDetailsModal.tsx', code);
