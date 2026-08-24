const fs = require('fs');
let code = fs.readFileSync('src/components/home/sections/ProductGridSection.tsx', 'utf8');

// Replace the max-w-[1400px] and its paddings to have appropriate padding
code = code.replace(
  /"max-w-\[1400px\] mx-auto w-full px-4 lg:px-8 pt-2 pb-8 rounded-3xl"/g,
  '"max-w-[1280px] mx-auto w-full px-4 sm:px-6 md:px-12 pt-4 pb-6 md:pb-10"'
);

// We had already replaced the scrollable div with a grid in the previous step. Let's make sure it looks like this:
// <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
// And ensure there are no left-over max-height or height.
// Let's also check the title spacing
code = code.replace(
  /<div className="flex items-end justify-between mb-5">/g,
  '<div className="flex items-end justify-between mb-4 md:mb-6">'
);

fs.writeFileSync('src/components/home/sections/ProductGridSection.tsx', code);
