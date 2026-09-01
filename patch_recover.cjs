const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

const regex = /<div className="p-6 flex justify-between items-center">[\s\S]*?<Logo \/>\s*<\/Link>/;
const replacement = `<div className="p-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Recovered!");
