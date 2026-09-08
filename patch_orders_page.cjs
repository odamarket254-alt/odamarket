const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/OrdersPage.tsx', 'utf8');

const replacement = `      if (error) {
        console.error("Error fetching orders:", error);
      } else if (data) {
        setOrders(data);
      }`;

code = code.replace(/      if \(data\) \{\s*setOrders\(data\);\s*\} else \{\s*\/\/ Mock data if table doesn't exist\s*setOrders\(\[\s*\{ id: 'ORD-2023-1045'.*?\s*\{ id: 'ORD-2023-1044'.*?\s*\]\);\s*\}/s, replacement);

fs.writeFileSync('src/pages/dashboard/OrdersPage.tsx', code);
console.log('Success');
