const fs = require('fs');
let code = fs.readFileSync('src/pages/WishlistPage.tsx', 'utf8');
code = code.replaceAll('bg-[#C65A28]/10 text-[#16A34A]', 'bg-emerald-100 text-emerald-700');
fs.writeFileSync('src/pages/WishlistPage.tsx', code);
