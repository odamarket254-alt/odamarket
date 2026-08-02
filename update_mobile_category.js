import fs from 'fs';
const file = 'src/components/home/CategoryGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetContent = `      {/* MOBILE */}
      <div className="md:hidden">
        <div className="flex justify-between items-center px-4 mt-6 mb-4">
          <h2 className="text-[20px] font-bold text-[#3A2418]">Shop by Categories</h2>
          <Link to="/products" className="text-sm font-semibold text-[#C65A28]">View All &rarr;</Link>
        </div>
        <div className="flex overflow-x-auto gap-[12px] px-4 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map((cat, idx) => (
            <Link key={idx} to={\`/products?category=\${cat.slug}\`} className="snap-start shrink-0">
              <div className="w-[85px] h-[115px] bg-[#FFFDF8] rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#ECECEC] flex flex-col items-center justify-start p-2 transition-transform active:scale-[0.98] active:shadow-[#C65A28]/20">
                <div className="w-[55px] h-[55px] sm:w-[60px] sm:h-[60px] rounded-full overflow-hidden mb-2 bg-[#FAF5EC] flex items-center justify-center shrink-0 border border-[#E8DCC9]">
                  {cat.image_url ? (
                    <OptimizedImage loading="lazy" src={cat.image_url} alt={cat.name} imgClassName="w-full h-full object-cover" className="w-full h-full flex items-center justify-center bg-transparent" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#8B857D]" />
                  )}
                </div>
                <h3 className="text-[12px] font-semibold text-[#3A2418] text-center leading-[1.2] line-clamp-2 w-full px-1">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>`;

const replacementContent = `      {/* MOBILE */}
      <div className="md:hidden">
        <div className="flex justify-between items-center px-4 mt-6 mb-4">
          <h2 className="text-[20px] font-bold text-[#3A2418]">Shop by Category</h2>
          <Link to="/products" className="text-sm font-semibold text-[#C65A28]">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 gap-[14px] px-4 pb-4">
          {categories.map((cat, idx) => (
            <Link key={idx} to={\`/products?category=\${cat.slug}\`} className="w-full">
              <div className="w-full h-[160px] bg-white rounded-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center p-[16px] transition-transform duration-200 active:scale-[0.97]">
                <div className="w-full h-[65%] flex items-center justify-center mb-2">
                  {cat.image_url ? (
                    <OptimizedImage loading="lazy" src={cat.image_url} alt={cat.name} imgClassName="w-full h-full object-contain" className="w-full h-full flex items-center justify-center bg-transparent" />
                  ) : (
                    <OptimizedImage
                      src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400&h=400"
                      alt={cat.name}
                      className="w-full h-full flex items-center justify-center bg-transparent"
                      imgClassName="w-full h-full object-contain mix-blend-multiply"
                      loading="lazy"
                    />
                  )}
                </div>
                <h3 className="text-[14px] font-bold text-[#3A2418] text-center leading-[1.2] line-clamp-2 w-full">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>`;

if (content.includes(targetContent)) {
  fs.writeFileSync(file, content.replace(targetContent, replacementContent));
  console.log("Successfully replaced content.");
} else {
  console.log("Target content not found.");
  // fall back to regex
  const fallbackRegex = /\{\/\* MOBILE \*\/\}(.|\n)*\{\/\* DESKTOP \*\/\}/gm;
  if (fallbackRegex.test(content)) {
    fs.writeFileSync(file, content.replace(fallbackRegex, replacementContent + '\n      {/* DESKTOP */}'));
    console.log("Replaced using fallback regex.");
  } else {
    console.log("Fallback failed as well.");
  }
}
