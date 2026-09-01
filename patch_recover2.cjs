const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

const regex = /<Logo \/>\s*<\/Link>\s*\)\}\s*<div className="flex items-center gap-3">/;
const replacement = `<Logo />
          </Link>
          <div className="flex items-center gap-3">`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Recovered 2!");
