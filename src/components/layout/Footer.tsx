import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Logo } from '../ui/Logo';

export function Footer() {
  return (
    <footer className="bg-[#3A2418] text-[#FAF5EC] font-sans pt-20 pb-24 md:pb-10 border-t border-[#D9A62E]/20">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
        
        {/* Brand & Newsletter Column */}
        <div className="lg:col-span-2">
          <Link to="/" className="inline-block mb-6"> 
             <div className="bg-white px-3 py-2 rounded-xl inline-flex items-center justify-center"><Logo className="w-[140px] md:w-[160px]" /></div>
          </Link>
          <p className="text-[#FAF5EC]/80 text-sm mb-8 leading-relaxed max-w-md">
            The premium destination for fresh groceries, electronics, and daily essentials in Africa. 
            Farm-to-table quality delivered directly to your doorstep.
          </p>
          
          <div className="bg-[#FAF5EC]/5 rounded-2xl p-6 border border-[#FAF5EC]/10">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#C65A28]" /> 
              Subscribe to our Newsletter
            </h4>
            <p className="text-xs text-[#FAF5EC]/60 mb-4">Get the latest updates on new products and upcoming sales.</p>
            <div className="flex relative">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-[#FAF5EC]/10 border border-[#FAF5EC]/20 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-[#FAF5EC]/40 focus:outline-none focus:border-[#D9A62E] transition-colors"
              />
              <button className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#C65A28] hover:bg-[#D9A62E] text-white rounded-lg px-3 flex items-center justify-center transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D9A62E]"></span> Shop
          </h4>
          <ul className="space-y-4">
            <li><Link to="/products" className="text-[#FAF5EC]/80 hover:text-[#D9A62E] transition-colors text-sm">All Products</Link></li>
            <li><Link to="/products?category=fresh-food" className="text-[#FAF5EC]/80 hover:text-[#D9A62E] transition-colors text-sm">Fresh Food</Link></li>
            <li><Link to="/products?category=electronics" className="text-[#FAF5EC]/80 hover:text-[#D9A62E] transition-colors text-sm">Electronics</Link></li>
            <li><Link to="/offers" className="text-[#D9A62E] hover:text-[#C65A28] transition-colors text-sm font-medium">Special Offers</Link></li>
            <li><Link to="/brands" className="text-[#FAF5EC]/80 hover:text-[#D9A62E] transition-colors text-sm">Top Brands</Link></li>
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D9A62E]"></span> Support
          </h4>
          <ul className="space-y-4">
            <li><Link to="/account" className="text-[#FAF5EC]/80 hover:text-[#D9A62E] transition-colors text-sm">My Account</Link></li>
            <li><Link to="/track-order" className="text-[#FAF5EC]/80 hover:text-[#D9A62E] transition-colors text-sm">Track Order</Link></li>
            <li><Link to="/returns" className="text-[#FAF5EC]/80 hover:text-[#D9A62E] transition-colors text-sm">Returns & Refunds</Link></li>
            <li><Link to="/faq" className="text-[#FAF5EC]/80 hover:text-[#D9A62E] transition-colors text-sm">FAQ</Link></li>
            <li><Link to="/help" className="text-[#FAF5EC]/80 hover:text-[#D9A62E] transition-colors text-sm">Help Center</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D9A62E]"></span> Contact Us
          </h4>
          <ul className="space-y-5">
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAF5EC]/10 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-[#C65A28]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#FAF5EC]/50 mb-0.5">Location</span>
                <span className="text-[#FAF5EC]/90 text-sm">Kenya</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAF5EC]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Phone className="w-4 h-4 text-[#C65A28]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#FAF5EC]/50 mb-0.5">Phone</span>
                <a href="tel:+254792867386" className="text-[#FAF5EC]/90 text-sm hover:text-[#D9A62E] transition-colors">+254 792 867386</a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAF5EC]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="w-4 h-4 text-[#C65A28]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#FAF5EC]/50 mb-0.5">Email</span>
                <a href="mailto:info@odamarket.co.ke" className="text-[#FAF5EC]/90 text-sm hover:text-[#D9A62E] transition-colors">info@odamarket.co.ke</a>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1400px] mx-auto px-6 border-t border-[#FAF5EC]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[#FAF5EC]/60 text-sm">
          &copy; {new Date().getFullYear()} ODA Market. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <span className="text-[#FAF5EC]/60 text-sm">Supported Payment:</span>
          <div className="px-3 py-1 bg-white/10 rounded border border-white/20 font-bold text-[#FAF5EC] tracking-wide text-sm">
            M-PESA
          </div>
        </div>
      </div>
    </footer>
  );
}
