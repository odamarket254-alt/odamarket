const fs = require('fs');
const file = 'src/components/home/sections/ProductGridSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const replaceRegex = /\{isCarousel \? \([\s\S]*?(?=\s*<\/section>)/m;

const replacement = `
      <div className="relative group">
        <button 
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-4 z-20 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:text-[#C65A28] hover:bg-gray-50 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button 
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-4 z-20 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-700 hover:text-[#C65A28] hover:bg-gray-50 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div 
          ref={scrollRef}
          className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory gap-[12px] md:gap-[16px] lg:gap-[20px] scrollbar-hide"
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="snap-start shrink-0 w-[calc(50vw-22px)] sm:w-[calc(33.333%-16px)] md:w-[calc(25%-16px)] lg:w-[calc(20%-16px)] xl:w-[calc(16.666%-17px)]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
`;

content = content.replace(replaceRegex, replacement.trim());
fs.writeFileSync(file, content);
console.log('Fixed ProductGridSection layout');
