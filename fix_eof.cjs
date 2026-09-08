const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/OrdersPage.tsx', 'utf8');

code = code.replace(/    <\/div>\n  \);\n\}\n$/, `      </div>\n    </div>\n  );\n}\n`);
fs.writeFileSync('src/pages/dashboard/OrdersPage.tsx', code);
