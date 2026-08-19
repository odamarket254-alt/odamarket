const fs = require('fs');
const file = 'src/components/home/WholesaleSection.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/w-\[260px\] lg:w-\[280px\]/g, 'w-[calc(50vw-22px)] sm:w-[260px] lg:w-[280px]');

fs.writeFileSync(file, content);
console.log('Fixed WholesaleSection width');
