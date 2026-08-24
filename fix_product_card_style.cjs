const fs = require('fs');
let code = fs.readFileSync('src/components/products/ProductCard.tsx', 'utf8');

// Update image container styles
const oldContainer = `"relative bg-white border border-[#E5E7EB] rounded-[11px] flex items-center justify-center overflow-visible",
          isList ? "w-full h-full p-2" : "w-full aspect-square p-2 md:p-3"`;

const newContainer = `"relative bg-[#FDFBF7] border border-[#EBE4D8] rounded-2xl shadow-[0_2px_10px_rgba(95,90,84,0.04)] flex items-center justify-center overflow-visible transition-colors duration-300 group-hover:bg-white group-hover:border-[#E1D7C6]",
          isList ? "w-full h-full p-2" : "w-full aspect-square p-2 md:p-3"`;

code = code.replace(oldContainer, newContainer);

// Update add to cart button border so it matches the background
const oldButton = `className="absolute bottom-2 right-2 w-[30px] h-[30px] rounded-full bg-[#C65A28] text-white flex items-center justify-center border-[1.5px] border-white shadow-sm hover:scale-105 active:scale-95 transition-transform z-10"`;
const newButton = `className="absolute bottom-2 right-2 w-[30px] h-[30px] rounded-full bg-[#C65A28] text-white flex items-center justify-center border-[1.5px] border-[#FDFBF7] group-hover:border-white shadow-[0_2px_8px_rgba(198,90,40,0.25)] hover:scale-105 active:scale-95 transition-all z-10"`;

code = code.replace(oldButton, newButton);

fs.writeFileSync('src/components/products/ProductCard.tsx', code);
console.log('ProductCard updated successfully.');
