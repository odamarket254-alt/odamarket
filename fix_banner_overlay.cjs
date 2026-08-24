const fs = require('fs');
let code = fs.readFileSync('src/components/home/sections/HeroBannerSection.tsx', 'utf8');

const regex = /<section className="w-full max-w-\[1600px\][\s\S]*?<\/section>/;

const newSection = `<section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-10">
      <div 
        className="relative w-full aspect-[2/1] sm:aspect-[2.2/1] md:aspect-[2.4/1] lg:aspect-[2.5/1] rounded-[30px] overflow-hidden group shadow-sm bg-gray-100"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {displayBanners.map((banner, index) => {
          const isActive = index === currentIndex;
          
          const slideContent = (
            <>
              {banner.desktop_image_url && (
                <OptimizedImage
                  src={banner.desktop_image_url}
                  alt={banner.title || 'Banner'}
                  className={cn("absolute inset-0 w-full h-full pointer-events-none", banner.mobile_image_url ? "hidden md:block" : "block")}
                  imgClassName="w-full h-full object-cover object-right lg:object-center"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              )}
              
              {banner.mobile_image_url && (
                <OptimizedImage
                  src={banner.mobile_image_url}
                  alt={banner.title || 'Banner'}
                  className="absolute inset-0 w-full h-full block md:hidden pointer-events-none"
                  imgClassName="w-full h-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              )}
            </>
          );

          return (
            <motion.div
              key={banner.id || index}
              initial={false}
              animate={{ opacity: isActive ? 1 : 0, zIndex: isActive ? 10 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
              style={{ pointerEvents: isActive ? 'auto' : 'none' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (!isActive) return;
                const swipe = offset.x;
                if (swipe < -50) {
                  handleNext();
                } else if (swipe > 50) {
                  handlePrev();
                }
              }}
            >
              {banner.button_link ? (
                <Link to={banner.button_link} className="absolute inset-0 w-full h-full block z-10" draggable={false}>
                  {slideContent}
                </Link>
              ) : (
                slideContent
              )}
            </motion.div>
          );
        })}

        {/* Navigation Arrows */}
        {displayBanners.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.preventDefault(); handlePrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 focus:outline-none border border-white/20"
            >
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); handleNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 focus:outline-none border border-white/20"
            >
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {displayBanners.length > 1 && (
          <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 z-20">
            {displayBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "h-1.5 md:h-2 rounded-full transition-all duration-300",
                  i === currentIndex ? "w-6 md:w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/80"
                )}
                aria-label={\`Go to slide \${i + 1}\`}
              />
            ))}
          </div>
        )}
      </div>
    </section>`;

code = code.replace(regex, newSection);
fs.writeFileSync('src/components/home/sections/HeroBannerSection.tsx', code);
