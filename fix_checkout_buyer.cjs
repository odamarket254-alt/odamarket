const fs = require('fs');
let content = fs.readFileSync('routes/checkoutRoutes.ts', 'utf8');

// Replace insert payload
content = content.replace(
  /buyer_id: user.id,\s*customer_id: user.id,\s*\/\/ Some schemas might expect customer_id instead or as well/g,
  "user_id: user.id,"
);

// Replace select fallback logic
content = content.replace(
  /o.buyer_id \|\| o.customer_id/g,
  "o.user_id || o.buyer_id || o.customer_id"
);

fs.writeFileSync('routes/checkoutRoutes.ts', content);
