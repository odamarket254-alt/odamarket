import { OptimizedImage } from "../ui/OptimizedImage";
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, Zap, Clock, ShieldCheck, Truck, RefreshCw, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { ProductCard } from '../products/ProductCard';
import useEmblaCarousel from 'embla-carousel-react';
import { toast } from 'sonner';

export const HeroSection = ({ slides }: { slides: any[] }) => {
  const [heroRef, heroApi] = useEmblaCarousel({ loop: true });
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!heroApi) return;
    const autoplay = setInterval(() => heroApi.scrollNext(), 5000);
    return () => clearInterval(autoplay);
  }, [heroApi]);

  if (!slides || slides.length === 0) return null;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 mb-12 sm:mb-16 lg:mb-20">
      <div className="relative rounded-[20px] overflow-hidden bg-[#FAF5EC] shadow-sm" ref={heroRef}>
        <div className="flex">
          {slides.map((slide, idx) => (
            <div key={idx} className="flex-[0_0_100%] min-w-0 relative">
              <div className="flex flex-row-reverse md:flex-row h-[220px] sm:h-[260px] md:h-[300px] lg:h-[400px]">
                <div className="w-[40%] h-full md:h-auto md:flex-1 relative md:order-2" style={{ backgroundColor: slide.bg_color || '#E8F5E9' }}>
                  <OptimizedImage src={slide.background_image || slide.desktop_image || ''} alt={slide.headline} imgClassName="w-full h-full object-cover md:rounded-l-[40px] lg:rounded-l-[100px]" className="w-full h-full" />
                </div>
                <div className="w-[60%] md:flex-1 p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center z-10 md:order-1 text-left" style={{ backgroundColor: slide.bg_color || '#E8F5E9' }}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-[550px] mx-0 w-full">
                    {slide.badge && (
                      <span className="inline-block px-3 py-1 bg-[#FFFDF8] text-[#C65A28] text-[10px] sm:text-xs md:text-sm font-semibold rounded-full mb-2 md:mb-4 shadow-sm">
                        {slide.badge}
                      </span>
                    )}
                    <h1 className="text-[clamp(16px,4vw,48px)] font-bold text-[#3A2418] leading-[1.1] mb-2 md:mb-6">
                      {slide.headline}
                    </h1>
                    <p className="text-[clamp(10px,2vw,16px)] text-[#5F5A54] mb-3 md:mb-8 line-clamp-2 md:line-clamp-none">
                      {slide.subtitle}
                    </p>
                    <div className="flex flex-row gap-2 md:gap-4 justify-start">
                      <Button onClick={() => navigate(slide.button_link || '/products')} className="w-auto bg-[#C65A28] hover:bg-[#C65A28] text-white h-8 sm:h-10 md:h-12 lg:h-14 px-3 sm:px-4 md:px-6 lg:px-8 rounded-full text-[10px] sm:text-xs md:text-base lg:text-lg shadow-lg shadow-[#C65A28]/30 transition-all hover:-translate-y-1">
                        {slide.button_text || 'Shop Now'} <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const PromoCardsSection = ({ banners }: { banners: any[] }) => {
  if (!banners || banners.length === 0) return null;
  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 mb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-auto -mx-4 sm:mx-0 sm:w-full">
        {banners.map((promo, idx) => (
          <motion.div key={idx} whileHover={{ y: -5 }} className={`${promo.bg_color || 'bg-[#D9A62E]/10'} rounded-none sm:rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group min-h-[220px]`}>
            <div className="relative z-10 w-2/3">
              <h3 className="text-xl sm:text-2xl font-bold text-[#3A2418] mb-2 leading-tight">{promo.title}</h3>
              <p className="text-[#5F5A54] text-sm mb-6">{promo.subtitle}</p>
              <Link to={promo.link || "/products"} className="inline-flex items-center text-sm font-bold text-[#3A2418] group-hover:text-[#C65A28] transition-colors">
                Shop Now <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
            {promo.image_url && <OptimizedImage src={promo.image_url} alt={promo.title} imgClassName="absolute -right-10 bottom-0 h-[120%] object-contain group-hover:scale-110 transition-transform duration-500 origin-bottom-right" className="absolute -right-10 bottom-0 h-[120%]" />}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export const ProductCarouselSection = ({ title, icon: Icon, iconColor, products }: any) => {
  const [emblaRef] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });
  const navigate = useNavigate();

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 mb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            <span className={`text-sm font-semibold uppercase tracking-wider ${iconColor}`}>{title}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#3A2418]">Featured For You</h2>
        </div>
        <Button variant="ghost" className="text-[#C65A28] hover:bg-[#C65A28]/10 hidden md:flex" onClick={() => navigate('/products')}>
          View All <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {products.map((product: any) => (
            <div key={product.id} className="pl-4 flex-[0_0_80%] sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_20%] min-w-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const WeeklyDealsSection = () => {
  return (
    <section className="w-full bg-[#E8F5E9] py-16 mb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block px-3 py-1 bg-red-100 text-red-600 font-semibold rounded-full mb-4">Ends Soon!</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#3A2418] mb-4">Deal of the Week</h2>
            <p className="text-[#5F5A54] text-lg mb-8 max-w-xl mx-auto lg:mx-0">
              Don't miss out on our spectacular weekly deals. Grab premium products at massive discounts before the timer runs out.
            </p>
            <div className="flex justify-center lg:justify-start mb-8 gap-4">
              <div className="flex flex-col items-center"><div className="w-14 h-14 bg-[#FFFDF8] rounded-xl flex items-center justify-center text-xl font-bold text-[#C65A28] shadow-sm mb-1">02</div><span className="text-xs text-[#5F5A54] font-medium uppercase tracking-wider">Days</span></div>
              <div className="text-2xl font-bold text-[#8B857D] mt-3">:</div>
              <div className="flex flex-col items-center"><div className="w-14 h-14 bg-[#FFFDF8] rounded-xl flex items-center justify-center text-xl font-bold text-[#C65A28] shadow-sm mb-1">14</div><span className="text-xs text-[#5F5A54] font-medium uppercase tracking-wider">Hours</span></div>
              <div className="text-2xl font-bold text-[#8B857D] mt-3">:</div>
              <div className="flex flex-col items-center"><div className="w-14 h-14 bg-[#FFFDF8] rounded-xl flex items-center justify-center text-xl font-bold text-[#C65A28] shadow-sm mb-1">45</div><span className="text-xs text-[#5F5A54] font-medium uppercase tracking-wider">Mins</span></div>
            </div>
            <Button className="bg-[#C65A28] hover:bg-[#C65A28] text-white px-8 py-6 rounded-full text-lg shadow-lg shadow-[#C65A28]/30 hover:-translate-y-1 transition-all">
              View All Deals <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-[#C65A28]/10 rounded-full blur-3xl transform scale-75"></div>
            <OptimizedImage src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80" alt="Fresh Deal" imgClassName="relative z-10 w-full max-w-lg mx-auto rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500 border-8 border-white" className="relative z-10 w-full max-w-lg mx-auto" />
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#B94A48]/100 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl transform rotate-12 z-20 border-4 border-white">
              -50%
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const WhyUsSection = () => (
  <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 mb-20">
    <div className="text-center mb-12">
      <h2 className="text-2xl md:text-3xl font-bold text-[#3A2418] mb-4">Why Shop With ODA Market</h2>
      <p className="text-[#5F5A54] max-w-2xl mx-auto">We are committed to providing you with the best shopping experience, premium quality products, and exceptional customer service.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { icon: ShieldCheck, title: "100% Secure Payments", desc: "Your transactions are protected with enterprise-grade security." },
        { icon: Truck, title: "Same Day Delivery", desc: "Get your groceries delivered fresh to your door in hours." },
        { icon: RefreshCw, title: "Easy Returns", desc: "Not satisfied? Return products easily within 7 days." },
        { icon: Zap, title: "Daily Flash Sales", desc: "Enjoy massive discounts on everyday essentials." }
      ].map((feature, idx) => (
        <div key={idx} className="bg-[#FFFDF8] p-6 rounded-2xl border border-[#E8DCC9] shadow-sm text-center hover:shadow-md transition-all group">
          <div className="w-16 h-16 bg-[#C65A28]/10 text-[#C65A28] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-[#C65A28] group-hover:text-white transition-all duration-300">
            <feature.icon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#3A2418] mb-3">{feature.title}</h3>
          <p className="text-[#5F5A54] text-sm leading-relaxed">{feature.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export const BrandsSection = ({ brands }: { brands: any[] }) => {
  const [brandsRef, brandsApi] = useEmblaCarousel({ align: 'start', loop: true, dragFree: true });
  React.useEffect(() => {
    if (!brandsApi) return;
    const autoplay = setInterval(() => brandsApi.scrollNext(), 3000);
    return () => clearInterval(autoplay);
  }, [brandsApi]);

  if (!brands || brands.length === 0) return null;

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 mb-20 py-12 border-y border-[#E8DCC9]">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#3A2418]">Featured Brands</h2>
      </div>
      <div className="overflow-hidden" ref={brandsRef}>
        <div className="flex items-center">
          {brands.map((brand, idx) => (
            <div key={idx} className="flex-[0_0_33.33%] sm:flex-[0_0_25%] md:flex-[0_0_16.66%] lg:flex-[0_0_14.28%] min-w-0 px-4">
              <div className="h-20 bg-[#FFFDF8] rounded-xl border border-[#E8DCC9] shadow-sm flex items-center justify-center p-4 hover:shadow-md transition-shadow grayscale hover:grayscale-0">
                <OptimizedImage src={brand.image_url || brand} alt="Brand" imgClassName="max-h-full max-w-full object-contain" className="w-full h-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const NewsletterSection = ({ settings }: { settings: any }) => (
  <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 mb-20">
    <div className="bg-[#C65A28] rounded-[20px] overflow-hidden relative shadow-xl">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80')] mix-blend-overlay opacity-10 object-cover"></div>
      <div className="flex flex-col-reverse md:flex-row items-center relative z-10 p-8 md:p-12 lg:p-16">
        <div className="flex-1 text-white mb-8 md:mb-0 md:pr-12 text-left">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {settings?.storefront_newslettermanager?.content?.title || <>Get <span className="text-[#D9A62E]">20% Off</span> Your First Order</>}
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-md mx-auto md:mx-0">
            {settings?.storefront_newslettermanager?.content?.subtitle || "Subscribe to our newsletter and be the first to know about new arrivals, special promotions, and exclusive discounts."}
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto md:mx-0" onSubmit={(e) => { e.preventDefault(); toast.success("Subscribed successfully!"); }}>
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B857D]" />
              <input type="email" placeholder="Enter your email address" required className="w-full h-14 pl-12 pr-4 rounded-full bg-[#FFFDF8] text-[#3A2418] focus:outline-none focus:ring-2 focus:ring-amber-400 border-0" />
            </div>
            <Button type="submit" className="h-14 px-8 rounded-full bg-[#D9A62E] hover:bg-[#D9A62E] text-white font-semibold whitespace-nowrap transition-colors">Subscribe</Button>
          </form>
        </div>
        <div className="flex-1 hidden md:flex justify-center relative">
          <div className="w-72 h-72 lg:w-96 lg:h-96 rounded-full bg-[#FFFDF8]/10 backdrop-blur-md absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          <OptimizedImage src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&q=80" alt="Fresh Produce" imgClassName="relative z-10 w-full max-w-sm rounded-full shadow-2xl border-4 border-white/20 transform rotate-6 hover:rotate-0 transition-transform duration-500" className="relative z-10 w-full max-w-sm rounded-full" />
        </div>
      </div>
    </div>
  </section>
);
