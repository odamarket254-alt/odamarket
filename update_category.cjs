const fs = require('fs');
const file = 'src/components/home/sections/CategoryGridSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  if (isLoading) {
    return (
      <section className="max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-6 md:py-8 bg-[#F8F6F2] md:bg-transparent">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#3A2418]">Shop by Category</h2>
        </div>
        
        {/* Mobile Skeleton */}
        <div className="md:hidden grid grid-cols-2 gap-[14px]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center p-4 bg-white rounded-[18px] border border-[#E8DCC9]/30 shadow-sm animate-pulse h-[160px]">
              <div className="w-full h-[65%] mb-2 rounded-xl bg-[#E8DCC9]/50"></div>
              <div className="w-20 h-4 bg-[#E8DCC9]/50 rounded-full mt-auto mb-1"></div>
            </div>
          ))}
        </div>

        {/* Desktop Skeleton */}
        <div className="hidden md:flex gap-4 lg:gap-6 overflow-hidden py-2 px-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none w-[150px] md:w-[180px] flex flex-col items-center p-6 bg-[#FFFDF8] rounded-[24px] border border-[#E8DCC9]/50 shadow-[0_8px_20px_rgba(45,45,45,0.04)] animate-pulse h-[180px]">
              <div className="w-full flex-1 mb-4 rounded-2xl bg-[#E8DCC9]/50"></div>
              <div className="w-24 h-4 bg-[#E8DCC9]/50 rounded-full mt-auto"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-6 md:py-8 bg-[#F8F6F2] md:bg-transparent relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#3A2418] tracking-tight">{section.title || "Shop by Category"}</h2>
          {section.subtitle && <p className="text-[#5F5A54] mt-1 hidden md:block">{section.subtitle}</p>}
        </div>
        <Link 
          to="/categories" 
          className="group flex items-center text-sm md:text-base font-bold md:font-semibold text-[#C65A28] hover:text-[#A0451C] transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      {/* Mobile Grid View */}
      <div className="md:hidden grid grid-cols-2 gap-[14px]">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={\`/c/\${category.slug || category.id}\`}
            className="flex flex-col items-center bg-white rounded-[18px] p-4 shadow-[0_2px_12px_rgba(45,45,45,0.03)] active:scale-[0.97] transition-transform duration-200 h-[160px]"
          >
            <div className="w-full h-[65%] flex items-center justify-center mb-2">
              {category.image_url ? (
                <OptimizedImage 
                  src={category.image_url} 
                  alt={category.name} 
                  className="w-full h-full"
                  imgClassName="w-full h-full object-contain" 
                  loading="lazy"
                />
              ) : (
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400&h=400"
                  alt={category.name}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-contain mix-blend-multiply"
                  loading="lazy"
                />
              )}
            </div>
            <div className="flex-1 flex items-center justify-center w-full">
              <span className="text-[14px] font-bold text-[#3A2418] text-center line-clamp-2 leading-[1.2]">
                {category.name}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop Carousel View */}
      <div className="hidden md:block relative group/carousel">
        {/* Navigation Arrows (Desktop) */}
        {showLeftNav && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(45,45,45,0.1)] border border-[#E8DCC9] text-[#3A2418] hover:bg-[#FAF5EC] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-[#C65A28]"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory py-4 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              to={\`/c/\${category.slug || category.id}\`}
              className="snap-start flex-none w-[150px] md:w-[180px] h-auto flex flex-col items-center p-6 bg-[#FFFDF8] rounded-[24px] border border-[#E8DCC9]/50 shadow-[0_8px_20px_rgba(45,45,45,0.04)] hover:shadow-[0_12px_30px_rgba(198,90,40,0.12)] hover:scale-100 hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-full flex-1 mb-4 rounded-2xl bg-[#FAF5EC] bg-gradient-to-br from-[#FAF5EC] to-[#E8DCC9]/30 flex items-center justify-center overflow-hidden relative shadow-inner min-h-[100px]">
                {category.image_url ? (
                  <OptimizedImage 
                    src={category.image_url} 
                    alt={category.name} 
                    className="w-full h-full"
                    imgClassName="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply" 
                    loading="lazy"
                  />
                ) : (
                  <Layers className="w-10 h-10 text-[#D9A62E] group-hover:scale-110 transition-transform duration-500" />
                )}
              </div>
              <div className="h-auto flex items-center justify-center w-full">
                <span className="text-[15px] font-bold text-[#3A2418] text-center group-hover:text-[#C65A28] line-clamp-1 leading-[1.2] transition-colors">
                  {category.name}
                </span>
              </div>
              {category.product_count > 0 && (
                <span className="mt-1 text-[13px] font-medium text-[#8B857D] group-hover:text-[#C65A28]/80 transition-colors">
                  {category.product_count} {category.product_count === 1 ? 'Item' : 'Items'}
                </span>
              )}
            </Link>
          ))}
        </div>

        {showRightNav && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(45,45,45,0.1)] border border-[#E8DCC9] text-[#3A2418] hover:bg-[#FAF5EC] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-[#C65A28]"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Animated Scrollbar (Desktop Only) */}
      {categories.length > 5 && (
        <div className="hidden md:block max-w-[200px] mx-auto mt-6 h-1.5 bg-[#E8DCC9] rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute top-0 bottom-0 bg-[#C65A28] rounded-full"
            style={{ width: '30%', left: \`\${scrollProgress * 0.7}%\` }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
          />
        </div>
      )}
    </section>
  );
};`;

const startIndex = content.indexOf('  if (isLoading) {');
if (startIndex === -1) {
  console.log("Could not find start index");
  process.exit(1);
}

const newContent = content.substring(0, startIndex) + replacement;
fs.writeFileSync(file, newContent);
console.log("Updated file");
