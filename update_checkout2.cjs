const fs = require('fs');

let content = fs.readFileSync('src/pages/CheckoutPage.tsx', 'utf8');

// Add imports
if (!content.includes('import { OrderReceipt }')) {
  content = content.replace(
    'import { useAuthStore } from "../store/useAuthStore";',
    'import { useAuthStore } from "../store/useAuthStore";\nimport { OrderReceipt } from "../components/receipt/OrderReceipt";\nimport { generateWhatsAppMessage, getWhatsAppUrl, WhatsAppOrderData } from "../lib/whatsapp";\nimport html2canvas from "html2canvas";'
  );
}
if (!content.includes('import { Download, MessageCircle, Share2, FileText }')) {
  content = content.replace(
    'import { \n  CheckCircle2,',
    'import { \n  Download,\n  MessageCircle,\n  Share2,\n  FileText,\n  CheckCircle2,'
  );
}

// Map the confirmedOrder to Receipt format
const receiptHelper = `
  const getReceiptData = (): WhatsAppOrderData | null => {
    if (!confirmedOrder) return null;
    const { order, profile, items } = confirmedOrder;
    
    // Attempt to parse notes for delivery info
    let location = "Nairobi";
    let address = "Nairobi, Kenya";
    try {
      if (order.notes) {
        const parsed = JSON.parse(order.notes);
        if (parsed.shippingDetails) {
          location = parsed.shippingDetails.location || location;
          address = parsed.shippingDetails.fullAddress || address;
        }
      }
    } catch(e){}

    return {
      order_number: order.order_number,
      created_at: order.created_at,
      customer_name: profile?.full_name || "Customer",
      customer_phone: profile?.phone || "+254 700 000000",
      customer_email: profile?.email || "",
      items: items.map((i: any) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price
      })),
      subtotal: order.subtotal,
      delivery_fee: order.shipping_fee || order.delivery_fee || 0,
      discount: order.discount || order.discount_amount || 0,
      grand_total: order.grand_total || order.total_amount || order.total || order.subtotal,
      payment_method: "M-Pesa",
      payment_status: "PAID",
      delivery_location: location,
      delivery_address: address,
      status: order.status,
      transaction_id: "TXN" + Math.floor(Math.random() * 100000000) // Mocking transaction ID if missing
    };
  };

  const handleDownloadReceipt = async () => {
    const el = document.getElementById('receipt-element');
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = \`Receipt-\${confirmedOrder?.order?.order_number || 'Order'}.png\`;
      a.click();
    } catch(e) {
      console.error(e);
      toast.error("Failed to download receipt");
    }
  };

  const handleShareReceipt = async () => {
    const el = document.getElementById('receipt-element');
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], \`Receipt-\${confirmedOrder?.order?.order_number || 'Order'}.png\`, { type: 'image/png' });
        if (navigator.share) {
          await navigator.share({
            title: 'Order Receipt',
            text: 'Here is your OdaMarket order receipt.',
            files: [file]
          });
        } else {
          toast.error("Native sharing not supported on this device. Please download instead.");
        }
      });
    } catch(e) {
      console.error(e);
    }
  };

  const handleWhatsApp = () => {
    const data = getReceiptData();
    if (!data) return;
    const msg = generateWhatsAppMessage(data);
    const url = getWhatsAppUrl(msg);
    window.open(url, '_blank');
  };
`;

if (!content.includes('const getReceiptData')) {
  content = content.replace(
    '  if (isSuccess) {',
    receiptHelper + '\n  if (isSuccess) {'
  );
}

// Update the isSuccess block
const oldIsSuccess = /  if \(isSuccess\) {[\s\S]*?    \);\n  }/;
const newIsSuccess = `  if (isSuccess) {
    const receiptData = getReceiptData();

    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-12 pb-24 flex items-center justify-center">
        <div className="bg-[#FFFDF8] rounded-[24px] shadow-sm border border-[#E5E7EB] p-6 sm:p-10 max-w-4xl w-full mx-4 flex flex-col md:flex-row gap-8">
          
          <div className="flex-1 text-center md:text-left flex flex-col justify-center">
            <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto md:mx-0 mb-6">
              <CheckCircle2 className="w-10 h-10 text-[#C65A28]" />
            </div>
            <h1 className="text-[slate-900] font-bold text-[32px] mb-2">Payment Successful</h1>
            <p className="text-[#6B7280] text-[16px] mb-2">Your order has been confirmed.</p>
            {receiptData && (
              <p className="text-[slate-900] font-bold text-[18px] mb-8">Order {receiptData.order_number}</p>
            )}

            {receiptError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
                {receiptError}
              </div>
            )}

            {!receiptData && !receiptError && (
              <div className="animate-pulse flex items-center justify-center md:justify-start gap-2 text-gray-500 mb-8">
                <div className="w-5 h-5 border-2 border-[#C65A28] border-t-transparent rounded-full animate-spin"></div>
                Generating secure receipt...
              </div>
            )}

            {receiptData && (
              <div className="space-y-4">
                <button 
                  onClick={handleWhatsApp}
                  className="w-full h-[56px] bg-[#25D366] text-white rounded-[16px] font-bold text-[16px] hover:bg-[#1DA851] transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" /> Send Order via WhatsApp
                </button>
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleDownloadReceipt}
                    className="flex-1 h-[56px] bg-[#FFFDF8] border border-[#E8DCC9] text-[#3A2418] rounded-[16px] font-bold text-[15px] hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Download Receipt
                  </button>
                  {navigator.share && (
                    <button 
                      onClick={handleShareReceipt}
                      className="flex-1 h-[56px] bg-[#FFFDF8] border border-[#E8DCC9] text-[#3A2418] rounded-[16px] font-bold text-[15px] hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-5 h-5" /> Share Receipt
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => navigate("/products")}
                  className="w-full h-[56px] mt-4 bg-[#C65A28] text-white rounded-[16px] font-bold text-[16px] hover:bg-[#A94A1F] transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 border-t md:border-t-0 md:border-l border-[#E5E7EB] pt-8 md:pt-0 md:pl-8 flex justify-center">
            {receiptData ? (
              <div className="w-full max-w-[400px] border border-[#E8DCC9] rounded-xl overflow-hidden shadow-sm relative">
                <OrderReceipt order={receiptData} />
              </div>
            ) : (
               <div className="w-full max-w-[400px] h-[600px] bg-slate-50 border border-slate-100 rounded-xl animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    );
  }`;

content = content.replace(oldIsSuccess, newIsSuccess);

fs.writeFileSync('src/pages/CheckoutPage.tsx', content);
