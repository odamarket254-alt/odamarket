const fs = require('fs');
let content = fs.readFileSync('routes/checkoutRoutes.ts', 'utf8');
content = content.replace(/grand_total: totalAmount,/g, "total_amount: totalAmount,");
fs.writeFileSync('routes/checkoutRoutes.ts', content);
