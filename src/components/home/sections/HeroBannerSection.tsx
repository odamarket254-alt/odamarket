import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { HomepageSection } from '../../../types/homepage';
import { Link } from "react-router-dom";
import { OptimizedImage } from "../../ui/OptimizedImage";
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';

interface HeroBannerSectionProps {
  section: HomepageSection;
}

const AfricaWatermark = () => (
  <svg className="absolute right-0 top-0 h-full w-auto opacity-[0.03] pointer-events-none transform translate-x-1/4 scale-150" viewBox="0 0 500 500" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M239.5,88.7c-4.4-1.2-8.5-3.8-12.7-5.5c-4.9-2-9.7-4.1-14.8-5.3c-13.6-3.2-27.4-4-41.4-1.4c-9,1.7-17,5.5-23.7,11.8c-6,5.6-9.8,12.5-12,20.4c-1.4,5.1-1.7,10.4-1.4,15.7c0.4,7.8,2,15.4,5.3,22.4c3.4,7.1,7.8,13.4,13.4,18.8c5.8,5.6,12.1,10.4,19.2,14.4c7.6,4.3,15.5,7.7,23.8,10c8.6,2.4,17.4,3.7,26.3,3.7c9,0,17.9-1.3,26.6-3.8c8.3-2.4,16.2-5.9,23.8-10.4c7-4.1,13.3-9.1,18.9-14.9c5.2-5.4,9.4-11.7,12.4-18.6c3.1-7.2,4.8-14.9,4.9-22.8c0.1-5.3-0.5-10.6-2-15.7c-2.3-7.7-6.2-14.5-11.8-20C287.6,91.8,279.4,87.7,270.3,85.6c-4.6-1.1-9.3-1.6-14-1.6C251.5,84,245.5,86,239.5,88.7z M263.8,409.8c-1.3-1.4-3.3-2.4-5.2-3.1c-14.2-4.9-28.7-9-43.4-12.2c-15.4-3.3-30.8-6.1-46.4-7.5c-16-1.4-32.2-1.7-48.4-1.3c-16.1,0.4-32,2-47.8,4.7c-7.9,1.4-15.7,3-23.4,5c-7.7,2-15.4,4.2-22.9,6.7c-7.3,2.4-14.5,5.1-21.5,8.1C21,392.3,11.2,382,3.1,369c-2-3.2-3.9-6.5-5.5-10c-3-6.5-5.3-13.4-6.9-20.4c-1.6-7-2.6-14.2-2.9-21.5c-0.3-7.5,0.2-15.1,1.5-22.5c1.4-7.7,3.6-15.2,6.5-22.4c3-7.4,6.7-14.4,11.1-21.1c4.5-6.9,9.7-13.3,15.5-19.1c5.9-5.9,12.4-11.3,19.4-16c7.3-4.9,15-9.2,23-12.8c8.2-3.7,16.7-6.8,25.4-9.3c8.9-2.5,18-4.5,27.2-5.8c9.3-1.3,18.7-2,28.2-2.1c9.7-0.1,19.3,0.5,28.9,1.7c9.5,1.2,18.9,3,28.2,5.3c9.1,2.2,18.1,5,26.9,8.4c8.7,3.3,17.2,7.2,25.4,11.5c7.9,4.2,15.6,8.9,23,14.1c7.2,5,14,10.5,20.5,16.4c6.2,5.6,12.1,11.6,17.6,18c5.2,6.1,10.1,12.5,14.6,19.2c4.3,6.5,8.1,13.3,11.6,20.4c3.2,6.6,6.1,13.4,8.5,20.4c2.3,6.8,4.3,13.8,5.8,20.9c1.4,6.8,2.4,13.7,3,20.7c0.6,6.8,0.8,13.8,0.6,20.7c-0.2,7.1-0.9,14.1-2,21.1c-1.1,6.8-2.6,13.5-4.5,20c-1.9,6.5-4.3,12.9-7.1,19c-2.7,6-5.8,11.8-9.3,17.4c-3.4,5.4-7.2,10.6-11.4,15.5c-4,4.7-8.4,9.2-13.1,13.3C271.7,402.1,267.8,406,263.8,409.8z"/>
  </svg>
);

const OrganicShapes = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <svg className="absolute -bottom-24 -left-24 w-96 h-96 opacity-40 text-[#C65A28]" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M47.7,-57.2C59.4,-45.5,64.8,-27.1,68.4,-8.1C72,11,73.8,30.6,65.2,45.8C56.6,61,37.6,71.8,17.8,75C-2,78.2,-22.6,73.8,-39.3,62.8C-56,51.8,-68.8,34.2,-73.4,15.1C-78,-4,-74.4,-24.5,-63.3,-40.1C-52.2,-55.7,-33.6,-66.4,-16.1,-69.1C1.4,-71.8,22,-66.5,36.1,-58.9Z" transform="translate(100 100)" />
    </svg>
    <svg className="absolute top-0 right-0 w-[800px] h-[800px] opacity-[0.15] text-[#D9A62E] transform translate-x-1/3 -translate-y-1/4" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M54.8,-63.7C69.3,-50.2,78.1,-30.2,80.1,-9.8C82.1,10.6,77.3,31.4,65.2,47.8C53.1,64.2,33.7,76.2,11.8,79.5C-10.1,82.8,-34.5,77.4,-51.7,63.1C-68.9,48.8,-78.9,25.6,-77.8,4.2C-76.7,-17.2,-64.5,-36.8,-49.6,-50.4C-34.7,-64,-17.4,-71.6,2.1,-74C21.6,-76.4,40.3,-77.2,54.8,-63.7Z" transform="translate(100 100)" />
    </svg>
    <svg className="absolute bottom-0 left-1/4 w-[500px] h-[500px] opacity-20 text-[#2F6B45] transform -translate-x-1/2 translate-y-1/2" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M43.7,-59.5C57.4,-49.9,69.5,-37.2,74.7,-21.8C79.9,-6.4,78.2,11.7,70,26.9C61.8,42.1,47.1,54.4,30.8,61C14.5,67.6,-3.4,68.5,-20.9,64.1C-38.4,59.7,-55.5,50,-64.5,35.4C-73.5,20.8,-74.4,1.3,-69.1,-16.1C-63.8,-33.5,-52.3,-48.8,-38,-58.5C-23.7,-68.2,-11.9,-72.3,1.9,-74.6C15.7,-76.9,30,-77.4,43.7,-59.5Z" transform="translate(100 100)" />
    </svg>
  </div>
);

const UpwardArrow = () => (
  <svg className="absolute right-12 bottom-12 w-64 h-64 text-[#C65A28] opacity-20 pointer-events-none transform -rotate-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 90 Q 40 90, 60 60 T 90 20 M 70 20 L 90 20 L 90 40" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const HeroBannerSection = ({ section }: HeroBannerSectionProps) => {
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*').limit(100)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (!error && data) {
        setBanners(data);
      }
    };
    fetchBanners();

    

    
  }, []);

  const hasBanners = banners.length > 0;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!hasBanners || section.settings?.auto_play === false) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length, section.settings?.auto_play, hasBanners]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-8 mt-2 sm:mt-6">
      <div className="w-auto -mx-4 sm:mx-0 sm:w-full relative overflow-hidden bg-[#FAF5EC] group rounded-none sm:rounded-xl md:rounded-2xl shadow-none sm:shadow-sm aspect-[16/8] sm:aspect-[16/7] lg:aspect-[16/6]">
        <OrganicShapes />
        <AfricaWatermark />
        <UpwardArrow />
        
        <div 
          className="flex transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] h-full z-10 relative"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
        {!hasBanners ? (
          <div className="min-w-full h-full relative flex-shrink-0 flex items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF5EC] via-[#FAF5EC]/90 to-transparent z-10 pointer-events-none" />
            <OptimizedImage src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80" alt="Premium Groceries" imgClassName="absolute right-0 top-0 w-[65%] sm:w-2/3 h-full object-cover rounded-none md:rounded-bl-[100px] opacity-80" className="absolute right-0 top-0 w-[65%] sm:w-2/3 h-full rounded-none md:rounded-bl-[100px] overflow-hidden" />
            <div className="w-full px-4 sm:px-8 lg:px-16 z-20 relative">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-[210px] min-[375px]:max-w-[240px] sm:max-w-[280px] md:max-w-2xl"
              >
                <span className="inline-block py-0.5 px-2 sm:py-1 sm:px-3 md:py-1.5 md:px-4 rounded-full bg-[#D9A62E]/20 text-[#C65A28] text-[9px] min-[375px]:text-[10px] sm:text-[11px] md:text-sm font-bold tracking-widest uppercase mb-1 sm:mb-3 md:mb-6 border border-[#D9A62E]/40 shadow-sm">
                  Welcome to ODA Market
                </span>
                <h2 className="text-[18px] min-[375px]:text-[22px] leading-[1.15] sm:text-2xl md:text-5xl lg:text-7xl font-bold text-[#3A2418] mb-1 sm:mb-3 md:mb-6 tracking-tight">
                  E-Commerce <br className="hidden sm:block"/>in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C65A28] to-[#D9A62E]">Africa</span>
                </h2>
                <p className="text-[10px] min-[375px]:text-[12px] sm:text-xs md:text-lg text-[#3A2418]/70 mb-2 sm:mb-4 md:mb-10 max-w-[190px] min-[375px]:max-w-[220px] sm:max-w-[240px] md:max-w-lg leading-tight md:leading-relaxed line-clamp-2 md:line-clamp-none">
                  The premium destination for fresh groceries, electronics, and daily essentials. Farm-to-table quality delivered directly to your doorstep.
                </p>
                <div className="flex flex-row flex-wrap items-center gap-1.5 sm:gap-2 md:gap-4 w-full">
                  <Link 
                    to="/products"
                    className="inline-flex items-center justify-center gap-1 md:gap-2 bg-[#C65A28] text-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-8 md:py-4 rounded-full font-semibold hover:bg-[#A84A1E] hover:scale-105 transition-all shadow-[0_8px_20px_rgba(198,90,40,0.3)] text-[10px] min-[375px]:text-[12px] sm:text-xs md:text-base"
                  >
                    Start Shopping <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5" />
                  </Link>
                  <Link 
                    to="/offers"
                    className="inline-flex items-center justify-center gap-1 md:gap-2 bg-white text-[#3A2418] px-3 py-1.5 sm:px-4 sm:py-2 md:px-8 md:py-4 rounded-full font-semibold hover:bg-[#FAF5EC] border border-[#E8DCC9] hover:scale-105 transition-all shadow-sm text-[10px] min-[375px]:text-[12px] sm:text-xs md:text-base"
                  >
                    <ShoppingBag className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5 text-[#D9A62E]" /> <span className="hidden sm:inline">View Offers</span><span className="sm:hidden">Offers</span>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          banners.map((banner, index) => (
            <div key={banner.id} className="min-w-full h-full relative flex-shrink-0 flex items-center">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FAF5EC] via-[#FAF5EC]/90 to-transparent z-10 pointer-events-none" />
              <OptimizedImage src={banner.image_url} alt={banner.title} imgClassName="absolute right-0 top-0 w-[65%] sm:w-2/3 h-full object-cover rounded-none md:rounded-bl-[100px] opacity-90" className="absolute right-0 top-0 w-[65%] sm:w-2/3 h-full rounded-none md:rounded-bl-[100px] overflow-hidden" />
              <div className="w-full px-4 sm:px-8 lg:px-16 z-20 relative">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={currentIndex === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-[210px] min-[375px]:max-w-[240px] sm:max-w-[280px] md:max-w-2xl"
                  >
                    {banner.subtitle && (
                      <span className="inline-block py-0.5 px-2 sm:py-1 sm:px-3 md:py-1.5 md:px-4 rounded-full bg-[#D9A62E]/20 text-[#C65A28] text-[9px] min-[375px]:text-[10px] sm:text-[11px] md:text-sm font-bold tracking-widest uppercase mb-1 sm:mb-3 md:mb-6 border border-[#D9A62E]/40 shadow-sm">
                        {banner.subtitle}
                      </span>
                    )}
                    <h2 className="text-[18px] min-[375px]:text-[22px] leading-[1.15] sm:text-2xl md:text-5xl lg:text-7xl font-bold text-[#3A2418] mb-1 sm:mb-3 md:mb-6 tracking-tight">
                      {banner.title.split(' ').map((word: string, i: number, arr: any[]) => (
                        i === arr.length - 1 ? <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-[#C65A28] to-[#D9A62E]">{word}</span> : <span key={i}>{word} </span>
                      ))}
                    </h2>
                    <p className="text-[10px] min-[375px]:text-[12px] sm:text-xs md:text-lg text-[#3A2418]/70 mb-2 sm:mb-4 md:mb-10 max-w-[190px] min-[375px]:max-w-[220px] sm:max-w-[240px] md:max-w-lg leading-tight md:leading-relaxed line-clamp-2 md:line-clamp-none">
                      Experience the finest selection of products with ODA Market's premium delivery service.
                    </p>
                    <div className="flex flex-row flex-wrap items-center gap-1.5 sm:gap-2 md:gap-4 w-full">
                      {banner.link_url && (
                        <Link 
                          to={banner.link_url}
                          className="inline-flex items-center justify-center gap-1 md:gap-2 bg-[#C65A28] text-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-8 md:py-4 rounded-full font-semibold hover:bg-[#A84A1E] hover:scale-105 transition-all shadow-[0_8px_20px_rgba(198,90,40,0.3)] text-[10px] min-[375px]:text-[12px] sm:text-xs md:text-base"
                        >
                          Shop Collection <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5" />
                        </Link>
                      )}
                      <Link 
                        to="/offers"
                        className="inline-flex items-center justify-center gap-1 md:gap-2 bg-white text-[#3A2418] px-3 py-1.5 sm:px-4 sm:py-2 md:px-8 md:py-4 rounded-full font-semibold hover:bg-[#FAF5EC] border border-[#E8DCC9] hover:scale-105 transition-all shadow-sm text-[10px] min-[375px]:text-[12px] sm:text-xs md:text-base"
                      >
                        <ShoppingBag className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5 text-[#D9A62E]" /> <span className="hidden sm:inline">View Offers</span><span className="sm:hidden">Offers</span>
                      </Link>
                    </div>
                  </motion.div>
                </div>
            </div>
          ))
        )}
      </div>
      
      {/* Indicators */}
      {hasBanners && banners.length > 1 && (
        <div className="absolute bottom-3 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-3 z-30 bg-white/50 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-full border border-white/40 shadow-sm">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 md:h-2.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'bg-[#C65A28] w-4 md:w-8' : 'bg-[#3A2418]/20 hover:bg-[#3A2418]/40 w-1.5 md:w-2.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  </div>
  );
};
