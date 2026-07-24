const fs = require('fs');
let code = fs.readFileSync('routes/authRoutes.ts', 'utf8');

code = code.replace("role: 'buyer'", "role: 'customer'");

fs.writeFileSync('routes/authRoutes.ts', code);
