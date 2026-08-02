const fs = require('fs');
const file = 'src/components/home/sections/CategoryGridSection.tsx';
let content = fs.readFileSync(file, 'utf8');

let newContent = content.replace(
  /className="group flex flex-col items-center/g,
  'className={`group flex-col items-center'
);

newContent = newContent.replace(
  /transition-all duration-300 h-\[160px\] md:h-auto"/g,
  'transition-all duration-300 h-[160px] md:h-auto ${index >= 4 ? \'hidden md:flex\' : \'flex\'}`'
);

newContent = newContent.replace(
  /categories\.map\(\(category\)/g,
  'categories.map((category, index)'
);

newContent = newContent.replace(
  /className="flex flex-col items-center p-4 md:p-6/g,
  'className={`flex-col items-center p-4 md:p-6'
);

newContent = newContent.replace(
  /animate-pulse h-\[160px\] md:h-\[180px\]"/g,
  'animate-pulse h-[160px] md:h-[180px] ${i >= 4 ? \'hidden md:flex\' : \'flex\'}`'
);

fs.writeFileSync(file, newContent);
console.log("Updated CategoryGridSection");
