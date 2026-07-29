const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', 'utf8');
code = code.replace(/\/\/ Setup real-time[\s\S]*?\}, \[user\]\);/, '}, [user]);');
fs.writeFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', code);
