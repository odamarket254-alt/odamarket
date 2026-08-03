const fs = require('fs');
const file = 'src/components/home/sections/CategoryGridSection.tsx';

let content = fs.readFileSync(file, 'utf8');

// Replace Skeleton
const oldSkeleton = `<div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-4 md:gap-6">
          {[...Array(18)].map((_, i) => (
            <div key={i} className={\`flex flex-col items-center p-4 bg-white rounded-[18px] border border-gray-100 shadow-sm animate-pulse \${i >= 6 ? 'hidden md:flex' : ''}\`}>
              <div className="w-full max-w-[120px] aspect-square rounded-[12px] bg-gray-100 mb-[20px]"></div>
              <div className="w-16 md:w-20 h-4 bg-gray-100 rounded-full"></div>
            </div>
          ))}
        </div>`;

const newSkeleton = `<div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3 md:gap-4 lg:gap-5">
          {[...Array(18)].map((_, i) => (
            <div key={i} className={\`flex flex-col items-center p-3 bg-white rounded-[18px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] animate-pulse h-full \${i >= 6 ? 'hidden md:flex' : ''}\`}>
              <div className="w-full aspect-square rounded-[14px] bg-gradient-to-b from-white to-[#FAFAFA] mb-3"></div>
              <div className="w-3/4 h-3 bg-gray-100 rounded-full mt-1"></div>
            </div>
          ))}
        </div>`;

content = content.replace(oldSkeleton, newSkeleton);

// Replace Grid
const oldGrid = `<div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-4 md:gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={\`/category/\${category.slug || category.id}\`}
            className="group flex flex-col items-center bg-white rounded-[18px] p-3 md:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[6px] transition-all duration-300 ease-out cursor-pointer"
          >
            <div className="w-full max-w-[120px] aspect-square bg-[#F9FAFB] rounded-[12px] flex items-center justify-center p-3 md:p-4 mb-[20px] overflow-hidden">
              {category.image_url ? (
                <OptimizedImage 
                  src={category.image_url} 
                  alt={category.name} 
                  className="w-full h-full flex items-center justify-center"
                  imgClassName="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out" 
                  loading="lazy"
                />
              ) : (
                <Layers className="w-8 h-8 md:w-10 md:h-10 text-gray-400 group-hover:scale-105 transition-transform duration-300 ease-out" />
              )}
            </div>
            
            <span className="text-[14px] md:text-[16px] font-semibold text-[#1F2937] text-center font-['Inter'] line-clamp-2 leading-tight w-full px-1">
              {category.name}
            </span>
          </Link>
        ))}
      </div>`;

const newGrid = `<div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-3 md:gap-4 lg:gap-5">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={\`/category/\${category.slug || category.id}\`}
            className="group flex flex-col bg-white rounded-[18px] p-2 md:p-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[6px] transition-all duration-300 ease-out cursor-pointer h-full"
          >
            {/* Image Container (approx 70%) */}
            <div className="w-full aspect-square bg-gradient-to-b from-white to-[#FAFAFA] rounded-[14px] flex items-center justify-center p-4 mb-3 overflow-hidden relative">
              {category.image_url ? (
                <OptimizedImage 
                  src={category.image_url} 
                  alt={category.name} 
                  className="w-full h-full flex items-center justify-center"
                  imgClassName="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out mix-blend-multiply" 
                  loading="lazy"
                />
              ) : (
                <Layers className="w-8 h-8 md:w-10 md:h-10 text-gray-300 group-hover:scale-105 transition-transform duration-300 ease-out" />
              )}
            </div>
            
            {/* Text Container (approx 30%) */}
            <div className="flex-1 flex flex-col justify-start items-center w-full px-1 pb-1">
              <span className="text-[13px] md:text-[14px] font-semibold text-[#1F2937] text-center font-['Inter'] line-clamp-2 leading-snug">
                {category.name}
              </span>
            </div>
          </Link>
        ))}
      </div>`;

content = content.replace(oldGrid, newGrid);

fs.writeFileSync(file, content);
console.log("Fixed image presentations");
