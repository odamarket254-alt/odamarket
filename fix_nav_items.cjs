const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

const navItemsReplacement = `
      case "buyer":
      default:
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/buyer/dashboard" },
          { icon: Package, label: "Shop", path: "/products" },
          { icon: Inbox, label: "My Orders", path: "/buyer/dashboard/orders" },
          { icon: Truck, label: "Track Orders", path: "/buyer/dashboard/track" },
          { icon: Heart, label: "Wishlist", path: "/wishlist" },
          { icon: RefreshCcw, label: "Buy Again", path: "/buyer/dashboard/buy-again" },
          { icon: List, label: "Shopping Lists", path: "/buyer/dashboard/lists" },
          { icon: MapPin, label: "Addresses", path: "/buyer/dashboard/addresses" },
          { icon: CreditCard, label: "Payments", path: "/buyer/dashboard/payments" },
          { icon: Gift, label: "Rewards", path: "/buyer/dashboard/rewards" },
          { icon: Tags, label: "Coupons", path: "/buyer/dashboard/coupons" },
          { icon: Bell, label: "Notifications", path: "/notifications" },
          { icon: Star, label: "Reviews", path: "/buyer/dashboard/reviews" },
          { icon: User, label: "Profile", path: "/buyer/dashboard/profile" },
          { icon: Settings, label: "Settings", path: "/buyer/dashboard/settings" },
          { icon: Headphones, label: "Support", path: "/support" },
        ];
`;

code = code.replace(/case "buyer":\s+default:\s+return \[\s+\{[\s\S]*?\}\s+\];/g, navItemsReplacement.trim());

// need to add Truck, RefreshCcw, MapPin, CreditCard, Gift, Star, User, Headphones to imports if they aren't there
const newImports = "import { Truck, RefreshCcw, MapPin, CreditCard, Gift, Star, User, Headphones } from 'lucide-react';";
code = code.replace("import { motion, AnimatePresence } from \"motion/react\";", newImports + "\\nimport { motion, AnimatePresence } from \"motion/react\";");

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
