const fs = require('fs');
const file = 'src/components/home/sections/CategoryGridSection.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /i >= 8 \? 'hidden md:flex' : ''/g,
  "''"
);

content = content.replace(
  /className="group flex flex-col bg-white rounded-\[18px\] p-2 md:p-3 shadow-\[0_2px_12px_rgba\(0,0,0,0\.03\)\] border border-gray-100 hover:shadow-\[0_12px_24px_rgba\(0,0,0,0\.08\)\] hover:-translate-y-\[6px\] transition-all duration-300 ease-out cursor-pointer h-full"/g,
  'className="group flex flex-col bg-white rounded-[14px] md:rounded-[18px] p-1.5 md:p-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[4px] md:hover:-translate-y-[6px] transition-all duration-300 ease-out cursor-pointer h-full"'
);

content = content.replace(
  /className="w-full aspect-square bg-gradient-to-b from-white to-\[#FAFAFA\] rounded-\[14px\] flex items-center justify-center p-4 mb-3 overflow-hidden relative"/g,
  'className="w-full aspect-square bg-gradient-to-b from-white to-[#FAFAFA] rounded-[10px] md:rounded-[14px] flex items-center justify-center p-2 md:p-4 mb-1.5 md:mb-3 overflow-hidden relative"'
);

content = content.replace(
  /span className="text-\[13px\] md:text-\[14px\] font-semibold text-\[#1F2937\] text-center font-\['Inter'\] line-clamp-2 leading-snug"/g,
  'span className="text-[10px] sm:text-[11px] md:text-[14px] font-semibold text-[#1F2937] text-center font-[\'Inter\'] line-clamp-2 leading-tight md:leading-snug"'
);

content = content.replace(
  /className="w-8 h-8 md:w-10 md:h-10 text-gray-300/g,
  'className="w-6 h-6 md:w-10 md:h-10 text-gray-300'
);

content = content.replace(
  /className="flex-1 flex flex-col justify-start items-center w-full px-1 pb-1"/g,
  'className="flex-1 flex flex-col justify-start items-center w-full px-0.5 md:px-1 pb-0.5 md:pb-1"'
);

// gap-2 on mobile instead of gap-3
content = content.replace(
  /className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4 lg:gap-5"/g,
  'className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-4 lg:gap-5"'
);


fs.writeFileSync(file, content);
