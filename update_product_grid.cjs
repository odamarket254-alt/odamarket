const fs = require('fs');
const file = 'src/components/home/sections/ProductGridSection.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /"grid gap-4 md:gap-6",\s*"grid-cols-2",[^)]+\)/s,
  `"grid gap-4 md:gap-5 lg:gap-6",
          "grid-cols-2", // Mobile default
          "sm:grid-cols-3", // Tablet
          "md:grid-cols-4", // Small Desktop
          "xl:grid-cols-5", // Large Desktop
          section.settings?.products_per_row_desktop === 6 && "2xl:grid-cols-6"
        )`
);

// Reduce top padding on section (e.g. from py-8 to py-4 or pt-2 pb-8)
content = content.replace(/px-4 lg:px-8 py-8 rounded-3xl/g, 'px-4 lg:px-8 pt-2 pb-8 rounded-3xl');

content = content.replace(
  /w-\[calc\(50vw-22px\)\] sm:w-\[calc\(33\.33vw-22px\)\] md:w-\[calc\(25%-12px\)\] lg:w-\[calc\(20%-16px\)\] xl:w-\[calc\(16\.666%-17px\)\]/g,
  'w-[calc(50vw-22px)] sm:w-[calc(33.333vw-22px)] md:w-[calc(25%-18px)] xl:w-[calc(20%-19px)]'
);

fs.writeFileSync(file, content);
console.log('Successfully updated ProductGridSection.tsx');
