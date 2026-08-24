const fs = require('fs');

function updateFile(path) {
  let code = fs.readFileSync(path, 'utf8');
  // Look for flex overflow-x-auto containers with -mx-4 px-4
  code = code.replace(/-mx-4 px-4(?!\s+md:mx-0)/g, '-mx-4 px-4 md:mx-0 md:px-0');
  code = code.replace(/-mx-4 px-4 sm:mx-0 sm:px-0/g, '-mx-4 px-4 md:mx-0 md:px-0');
  fs.writeFileSync(path, code);
}

updateFile('src/components/home/WholesaleSection.tsx');
updateFile('src/pages/dashboard/BuyerDashboardHome.tsx');
console.log('Fixed margins');
