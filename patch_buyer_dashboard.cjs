const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', 'utf8');

if (!code.includes('getWhatsAppLink')) {
  code = code.replace(/import \{ Link \} from 'react-router-dom';/, "import { Link } from 'react-router-dom';\nimport { getWhatsAppLink } from '../../utils/whatsapp';\nimport { MessageCircle } from 'lucide-react';");
}

const replacement = `
        </div>
      </div>
      
      {/* Floating Action Button for WhatsApp (Mobile Only) */}
      <div className="md:hidden fixed bottom-[84px] right-4 z-40">
        <a
          href={getWhatsAppLink("Hello ODA Market, I would like to place an order.")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <MessageCircle className="w-7 h-7" />
        </a>
      </div>
    </div>
  );
}
`;

const regex = /<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\s*function StatCard/m;

if (code.match(regex)) {
  code = code.replace(regex, replacement + "\nfunction StatCard");
  fs.writeFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', code);
  console.log("Patched buyer dashboard");
} else {
  console.log("Could not find regex match");
}
