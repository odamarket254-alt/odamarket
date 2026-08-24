const fs = require('fs');
let code = fs.readFileSync('src/components/home/WholesaleSection.tsx', 'utf8');

const wholesaleRegex = /<div className="flex overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-6 scrollbar-hide">/;
const newWholesale = `<div className="flex overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-6 scrollbar-hide [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>`;

code = code.replace(wholesaleRegex, newWholesale);
fs.writeFileSync('src/components/home/WholesaleSection.tsx', code);
console.log('Success WholesaleSection');
