const fs = require('fs');
let code = fs.readFileSync('src/components/home/sections/ProductGridSection.tsx', 'utf8');

const regexGrid = /<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">\s*\{products\.map\(\(product\) => \(\s*<ProductCard key=\{product\.id\} product=\{product\} \/>\s*\)\)\}\s*<\/div>/;

const newCarousel = `<div 
          className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 gap-3 md:gap-4 lg:gap-5 scrollbar-hide [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="snap-start shrink-0 w-[calc(45vw-12px)] sm:w-[calc(33.333vw-16px)] md:w-[calc(25vw-16px)] lg:w-[calc(20vw-16px)] xl:w-[220px]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>`;

if(code.match(regexGrid)) {
  code = code.replace(regexGrid, newCarousel);
  fs.writeFileSync('src/components/home/sections/ProductGridSection.tsx', code);
  console.log('Success ProductGridSection');
} else {
  console.log('Regex did not match ProductGridSection');
}
