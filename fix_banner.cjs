const fs = require('fs');
let code = fs.readFileSync('src/components/home/sections/HeroBannerSection.tsx', 'utf8');

const regex = /const slideContent = \([\s\S]*?\);\s*return \(\s*<motion\.div[\s\S]*?\{banner\.button_link \? \([\s\S]*?\) : \(\s*slideContent\s*\)\}\s*<\/motion\.div>\s*\);/g;

const replacement = `const hasImage = Boolean(banner.desktop_image_url || banner.mobile_image_url);
          
          const textOverlay = !hasImage && (
            <>
              <div 
                className="absolute inset-0 pointer-events-none mix-blend-multiply" 
                style={{ 
                  backgroundColor: banner.bg_color || '#000000', 
                  opacity: (banner.bg_overlay_opacity ?? 20) / 100 
                }} 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none md:w-3/4" />
              <div className="absolute inset-0 flex items-center">
                <div className="w-full px-6 md:px-12 lg:px-24">
                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -30 }}
                    transition={{ duration: 0.8, delay: isActive ? 0.2 : 0, ease: "easeOut" }}
                    className="max-w-[300px] sm:max-w-md md:max-w-2xl text-white"
                  >
                    {banner.badge && (
                      <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 mb-1 sm:mb-3 md:mb-5 bg-[#F97316] text-white text-[9px] sm:text-[10px] md:text-sm font-bold tracking-wider uppercase rounded-full shadow-sm border border-orange-400/20">
                        {banner.badge}
                      </span>
                    )}
                    <h2 className="text-xl sm:text-4xl md:text-[48px] lg:text-[56px] font-bold leading-[1.1] md:leading-[1.15] mb-1 sm:mb-2 md:mb-4 tracking-tight drop-shadow-md line-clamp-2">
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="text-[10px] sm:text-xs md:text-[18px] lg:text-[20px] text-gray-200 mb-3 sm:mb-6 md:mb-8 max-w-lg leading-relaxed drop-shadow line-clamp-2">
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 pointer-events-auto">
                      {banner.button_text && (
                        <Link 
                          to={banner.button_link || '#'}
                          className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 md:px-8 md:py-4 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs sm:text-sm md:text-base font-semibold rounded-lg sm:rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all hover:-translate-y-0.5"
                        >
                          {banner.button_text} <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        </Link>
                      )}
                      {banner.secondary_button_text && (
                        <Link 
                          to={banner.secondary_button_link || '#'}
                          className="inline-flex items-center justify-center px-3 py-1.5 sm:px-5 sm:py-2.5 md:px-8 md:py-4 bg-white/10 hover:bg-white text-white hover:text-gray-900 text-xs sm:text-sm md:text-base font-semibold rounded-lg sm:rounded-xl border border-white/50 hover:border-white transition-all hover:-translate-y-0.5 shadow-sm backdrop-blur-sm"
                        >
                          {banner.secondary_button_text}
                        </Link>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </>
          );

          const slideContent = (
            <>
              {banner.desktop_image_url && (
                <OptimizedImage
                  src={banner.desktop_image_url}
                  alt={banner.title || 'Banner'}
                  className={cn("absolute inset-0 w-full h-full pointer-events-none", banner.mobile_image_url ? "hidden md:block" : "block")}
                  imgClassName="w-full h-full object-cover object-center"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              )}
              
              {banner.mobile_image_url && (
                <OptimizedImage
                  src={banner.mobile_image_url}
                  alt={banner.title || 'Banner'}
                  className="absolute inset-0 w-full h-full block md:hidden pointer-events-none"
                  imgClassName="w-full h-full object-cover object-center"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              )}
              
              {textOverlay}
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
              {hasImage && banner.button_link ? (
                <a href={banner.button_link} className="absolute inset-0 w-full h-full block z-10" draggable={false}>
                  {slideContent}
                </a>
              ) : (
                slideContent
              )}
            </motion.div>
          );`;
          
code = code.replace(regex, replacement);
fs.writeFileSync('src/components/home/sections/HeroBannerSection.tsx', code);
