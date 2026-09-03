import React, { useState, useEffect } from "react";
import { MessageCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { getWhatsAppLink } from "../../utils/whatsapp";
import { useAuthStore } from "../../store/useAuthStore";
import { useCartStore } from "../../store/useCartStore";

export default function WhatsAppOrderingPage() {
  const { user } = useAuthStore();
  const { items, getCartTotal } = useCartStore();
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Customer";

  const buildMessage = () => {
    let msg = `Hello ODA Market, I am ${fullName} and I would like to place an order.\n\n`;
    
    if (items.length > 0) {
      msg += `*Order Items:*\n`;
      items.forEach((item, index) => {
        msg += `${index + 1}. ${item.name} (x${item.quantity})\n`;
      });
      msg += `\n*Total Amount:* Ksh ${getCartTotal().toLocaleString()}\n`;
    }

    if (address) {
      msg += `\n*Delivery Address:*\n${address}\n`;
    }

    if (notes) {
      msg += `\n*Notes:*\n${notes}\n`;
    }

    return msg;
  };

  const handleSend = () => {
    window.open(getWhatsAppLink(buildMessage()), "_blank");
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-[#25D366]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">WhatsApp Ordering</h1>
          <p className="text-slate-500">Order directly through our WhatsApp line</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Compose Your Message</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full delivery address..."
              className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] outline-none transition-all resize-y text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Additional Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions?"
              className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] outline-none transition-all resize-y text-sm"
            />
          </div>

          <button
            onClick={handleSend}
            className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <MessageCircle className="w-5 h-5" />
            Send via WhatsApp
          </button>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Current Cart
          </h2>
          
          {items.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center font-bold">
                <span className="text-slate-900">Estimated Total:</span>
                <span className="text-[#C65A28]">Ksh {getCartTotal().toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Your cart is empty.</p>
              <p className="text-sm mt-1">Add items to include them in your message.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
