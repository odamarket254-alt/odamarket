import { useState, useEffect, useRef } from 'react';
import { HomepageSection, HomepageBanner } from '../../../types/homepage';
import { Link } from "react-router-dom";
import { OptimizedImage } from "../../ui/OptimizedImage";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "../../../lib/utils";

interface HeroBannerSectionProps {
  section: HomepageSection;
}

export const HeroBannerSection = ({ section }: HeroBannerSectionProps) => {
  const allBanners = section.settings?.banners || [];
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    // Check schedule every 60 seconds instead of every second to avoid re-render thrashing
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Filter active and within schedule
  const activeBanners = allBanners.filter((b) => {
    if (!b.is_active) return false;
    
    if (b.start_date && new Date(b.start_date) > now) return false;
    if (b.end_date && new Date(b.end_date) < now) return false;
    return true;
  }).sort((a, b) => (a.position || 0) - (b.position || 0));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);


  
  // Add a fallback banner if none are available
  const displayBanners = activeBanners.length > 0 ? activeBanners : [{
    id: 'fallback-1',
    title: 'Experience Premium Quality',
    subtitle: 'The finest selection of products with our premium delivery service.',
    badge: 'WELCOME TO ODA',
    button_text: 'Shop Now',
    button_link: '/products',
    secondary_button_text: 'View Offers',
    secondary_button_link: '/offers',
    bg_overlay_opacity: 20,
    bg_color: '#000000',
    desktop_image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80',
    is_active: true,
    position: 0,
    start_date: null,
    end_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }] as HomepageBanner[];

  useEffect(() => {
    if (currentIndex >= displayBanners.length) {
      setCurrentIndex(0);
    }
  }, [displayBanners.length, currentIndex]);

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    
    if (!isPaused && (section.settings?.auto_play !== false)) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [displayBanners.length, isPaused, section.settings?.auto_play]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
  };

  if (displayBanners.length === 0) return null;

  return (
    <section className="w-full flex justify-center py-3 md:py-7">
      <div 
        className="relative w-[calc(100%-24px)] md:w-[calc(100%-64px)] max-w-[1280px] h-[180px] sm:h-[220px] md:h-[340px] lg:h-[370px] rounded-[18px] md:rounded-[24px] overflow-hidden group shadow-sm bg-gray-100"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {displayBanners.map((banner, index) => {
          const isActive = index === currentIndex;
          
          const hasImage = Boolean(banner.desktop_image_url || banner.mobile_image_url);
          
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
                  priority={index === 0}
                  imageType="banner"
                  fallback="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"
                />
              )}
              
              {banner.mobile_image_url && (
                <OptimizedImage
                  src={banner.mobile_image_url}
                  alt={banner.title || 'Banner'}
                  className="absolute inset-0 w-full h-full block md:hidden pointer-events-none"
                  imgClassName="w-full h-full object-cover object-center"
                  loading={index === 0 ? "eager" : "lazy"}
                  priority={index === 0}
                  imageType="banner"
                  fallback="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"
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
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
