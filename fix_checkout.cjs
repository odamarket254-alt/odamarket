const fs = require('fs');
let content = fs.readFileSync('src/pages/CheckoutPage.tsx', 'utf8');

// Ensure import for getWhatsAppLink or getWhatsAppUrl
if (!content.includes('getWhatsAppUrl')) {
  content = content.replace(
    'import { generateWhatsAppMessage } from "../lib/whatsapp";',
    'import { generateWhatsAppMessage, getWhatsAppUrl } from "../lib/whatsapp";'
  );
}

content = content.replace(
  'window.open(`https://wa.me/254740909652?text=${text}`, \'_blank\');',
  'window.open(getWhatsAppUrl(`Hello OdaMarket, I have just paid for order ${confirmedOrder?.order?.order_number || \'Order\'}. I will attach the receipt image I just downloaded.`), \'_blank\');'
);

fs.writeFileSync('src/pages/CheckoutPage.tsx', content);
