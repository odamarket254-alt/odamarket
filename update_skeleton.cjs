const fs = require('fs');
const file = 'src/components/home/sections/CategoryGridSection.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /className=\`flex flex-col items-center p-3 bg-white rounded-\[18px\] border border-gray-100 shadow-\[0_2px_12px_rgba\(0,0,0,0\.03\)\] animate-pulse h-full \$\{''\}\`/g,
  'className={`flex flex-col items-center p-1.5 md:p-3 bg-white rounded-[14px] md:rounded-[18px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] animate-pulse h-full`}'
);

content = content.replace(
  /className="w-full aspect-square rounded-\[14px\] bg-gradient-to-b from-white to-\[#FAFAFA\] mb-3"/g,
  'className="w-full aspect-square rounded-[10px] md:rounded-[14px] bg-gradient-to-b from-white to-[#FAFAFA] mb-1.5 md:mb-3"'
);

fs.writeFileSync(file, content);
