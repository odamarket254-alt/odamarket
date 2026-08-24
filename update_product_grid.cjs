const fs = require('fs');
let code = fs.readFileSync('src/components/home/sections/ProductGridSection.tsx', 'utf8');

const regex = /<div\s+ref=\{scrollRef\}\s+className="flex overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory gap-\[12px\] md:gap-\[16px\] lg:gap-\[20px\] scrollbar-hide"\s*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/;

// Let's replace the whole scrollable div with a grid
const newGrid = `<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>`;

if(code.match(regex)) {
  code = code.replace(regex, newGrid);
  // Also we need to remove the buttons for scrolling
  code = code.replace(/<button\s+onClick=\{scrollLeft\}[\s\S]*?<\/button>/, '');
  code = code.replace(/<button\s+onClick=\{scrollRight\}[\s\S]*?<\/button>/, '');
  fs.writeFileSync('src/components/home/sections/ProductGridSection.tsx', code);
  console.log('Success');
} else {
  console.log('Regex did not match');
}
