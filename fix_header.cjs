const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// Add import
content = content.replace(
  'import { useCartStore } from "../../store/useCartStore";',
  'import { useCartStore } from "../../store/useCartStore";\nimport { getWhatsAppLink } from "../../utils/whatsapp";'
);

// Replace WhatsApp link
content = content.replace(
  '<a href="https://wa.me/123456789"',
  '<a href={getWhatsAppLink("Hello ODA Market, I would like to place an order.")} target="_blank" rel="noopener noreferrer"'
);

// Fix link to help center to be /help-center instead of /help just in case
content = content.replace(
  '<Link to="/help" className="flex items-center gap-1.5 hover:text-[#D9A62E] transition-colors">',
  '<Link to="/help-center" className="flex items-center gap-1.5 hover:text-[#D9A62E] transition-colors">'
);

fs.writeFileSync('src/components/layout/Header.tsx', content);
