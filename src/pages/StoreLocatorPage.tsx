import React from "react";
import { Store, Construction } from "lucide-react";
import { Link } from "react-router-dom";

export default function StoreLocatorPage() {
  return (
    <div className="flex-1 w-full flex flex-col bg-[#FAF5EC] items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-[#E8DCC9] max-w-lg w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#C65A28]" />
        
        <div className="w-20 h-20 bg-[#FAF5EC] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#E8DCC9]">
          <Store className="w-10 h-10 text-[#C65A28]" />
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D9A62E]/10 text-[#D9A62E] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
          <Construction className="w-4 h-4" />
          <span>Coming Soon</span>
        </div>

        <h1 className="text-3xl font-bold text-[#3A2418] mb-4">Physical Stores</h1>
        
        <p className="text-[#5F5A54] leading-relaxed mb-8">
          Currently, ODA Market operates exclusively online to bring you the best deals and fastest delivery right to your doorstep. We don't have physical storefronts yet, but we're working on expanding in the future!
        </p>

        <Link
          to="/products"
          className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 bg-[#C65A28] text-white font-bold rounded-xl hover:bg-[#A84A1F] transition-colors shadow-sm"
        >
          Continue Shopping Online
        </Link>
      </div>
    </div>
  );
}
