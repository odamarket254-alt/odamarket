const fs = require('fs');
let code = fs.readFileSync('src/pages/WishlistPage.tsx', 'utf8');
code = code.replace(/const\s+\},\s*\[user\]\);/g, '}, [user]);');
fs.writeFileSync('src/pages/WishlistPage.tsx', code);
