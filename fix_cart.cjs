const fs = require('fs');
let code = fs.readFileSync('src/pages/CartPage.tsx', 'utf8');

code = code.replace(
  'const { items, removeItem, updateQuantity, getSubtotal, getTotal } = useCartStore();',
  'const { items, removeItem, updateQuantity, getCartSubtotal } = useCartStore();'
);

code = code.replace(
  'const subtotal = getTotal();',
  'const subtotal = getCartSubtotal();'
);

code = code.replace(
  /Ksh \{getSubtotal\(item\.price, item\.quantity\)\}/g,
  'Ksh {((parseFloat(String(item.price).replace(/[^0-9.]/g, "")) || 0) * item.quantity).toLocaleString()}'
);

fs.writeFileSync('src/pages/CartPage.tsx', code);
console.log("Fixed CartPage.tsx");
