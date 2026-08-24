const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', 'utf8');

// The grids are: <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
// Let's replace them with flex containers.
const oldGrid = /<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">\s*\{([\s\S]*?)\.length > 0 \? \(\s*([\s\S]*?)\.map\(product => \(\s*<ProductCard key=\{product\.id\} product=\{product\} \/>\s*\)\)\s*\) : \([\s\S]*?<\/div>\s*\)\}\s*<\/div>/g;

const carouselClass = `className="flex overflow-x-auto pb-4 gap-3 md:gap-4 lg:gap-5 scrollbar-hide [&::-webkit-scrollbar]:hidden snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}`;
const cardWrapper = `className="snap-start shrink-0 w-[calc(45vw-12px)] sm:w-[calc(33.333vw-16px)] md:w-[calc(25vw-16px)] lg:w-[calc(20vw-16px)] xl:w-[220px]"`;

code = code.replace(/<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">/g, 
  `<div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 scrollbar-hide [&::-webkit-scrollbar]:hidden snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>`
);

code = code.replace(/<ProductCard key=\{product\.id\} product=\{product\} \/>/g, 
  `<div key={product.id} className="snap-start shrink-0 w-[calc(45vw-12px)] sm:w-[calc(33.333vw-16px)] md:w-[calc(25vw-16px)] lg:w-[calc(20vw-16px)] xl:w-[220px]"><ProductCard product={product} /></div>`
);

fs.writeFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', code);
