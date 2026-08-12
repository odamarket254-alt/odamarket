const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminOrdersPage.tsx', 'utf8');

if (!content.includes('MessageCircle')) {
  content = content.replace(
    'import { Search, Filter, Calendar as CalendarIcon, Inbox, CheckCircle2, XCircle, Clock, Truck, MoreHorizontal, Eye, Printer } from "lucide-react";',
    'import { Search, Filter, Calendar as CalendarIcon, Inbox, CheckCircle2, XCircle, Clock, Truck, MoreHorizontal, Eye, Printer, MessageCircle } from "lucide-react";\nimport { generateWhatsAppMessage, getWhatsAppUrl, WhatsAppOrderData } from "../../lib/whatsapp";\nimport { toast } from "sonner";'
  );
}

const handleWhatsAppFunc = `
  const handleWhatsApp = async (orderId: string) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, profiles:user_id(first_name, last_name, email, phone)')
        .eq('id', orderId)
        .single();
        
      if (error || !order) throw error;
      
      const { data: items, error: itemsErr } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
        
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

      const whatsappData: WhatsAppOrderData = {
        order_number: order.order_number || order.id.slice(0,8).toUpperCase(),
        created_at: order.created_at,
        customer_name: \`\${order.profiles?.first_name || ''} \${order.profiles?.last_name || ''}\`.trim() || "Customer",
        customer_phone: order.profiles?.phone || "+254 700 000000",
        items: (items || []).map((i: any) => ({
          product_name: i.product_name || "Product",
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price
        })),
        subtotal: order.subtotal || order.total,
        delivery_fee: order.delivery_fee || 0,
        discount: order.discount_amount || 0,
        grand_total: order.total,
        payment_method: "M-Pesa",
        payment_status: "PAID",
        delivery_location: location,
        delivery_address: address,
        status: order.status,
      };

      const msg = generateWhatsAppMessage(whatsappData);
      const url = getWhatsAppUrl(msg);
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate WhatsApp message");
    }
  };
`;

if (!content.includes('const handleWhatsApp = async')) {
  content = content.replace(
    'const fetchOrders = async () => {',
    handleWhatsAppFunc + '\n  const fetchOrders = async () => {'
  );
}

const actionsBtnReplacement = `                         <Link to={\`/admin/dashboard/orders/\${order.id}\`} className="p-2 text-[#8B857D] hover:text-[#C65A28] hover:bg-[#E8DCC9] rounded-lg transition-colors" title="View details">
                           <Eye className="w-4 h-4" />
                         </Link>
                         {(order.status === 'processing' || order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') && (
                           <button onClick={() => handleWhatsApp(order.id)} className="p-2 text-[#8B857D] hover:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors" title="Send via WhatsApp">
                             <MessageCircle className="w-4 h-4" />
                           </button>
                         )}
                         <button className="p-2 text-[#8B857D] hover:text-[#5F5A54] hover:bg-[#E8DCC9] rounded-lg transition-colors" title="Print invoice">`;

content = content.replace(
  `                         <Link to={\`/admin/dashboard/orders/\${order.id}\`} className="p-2 text-[#8B857D] hover:text-[#C65A28] hover:bg-[#E8DCC9] rounded-lg transition-colors" title="View details">
                           <Eye className="w-4 h-4" />
                         </Link>
                         <button className="p-2 text-[#8B857D] hover:text-[#5F5A54] hover:bg-[#E8DCC9] rounded-lg transition-colors" title="Print invoice">`,
  actionsBtnReplacement
);

fs.writeFileSync('src/pages/admin/AdminOrdersPage.tsx', content);
