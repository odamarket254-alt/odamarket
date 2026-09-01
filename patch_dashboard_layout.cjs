const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

const replacement = `
      case "buyer":
      case "customer":
      default:
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/buyer/dashboard" },
          { icon: Store, label: "Shop", path: "/products" },
          { icon: FolderTree, label: "Categories", path: "/categories" },
          { icon: Package, label: "My Orders", path: "/buyer/dashboard/orders" },
          { icon: Truck, label: "Track Delivery", path: "/buyer/dashboard/track" },
          { icon: Heart, label: "Wishlist", path: "/wishlist" },
          { icon: ShoppingCart, label: "Shopping Cart", path: "/cart" },
          { icon: Gift, label: "Rewards", path: "/buyer/dashboard/rewards" },
          { icon: Ticket, label: "Coupons", path: "/buyer/dashboard/coupons" },
          { icon: CreditCard, label: "Payment Methods", path: "/buyer/dashboard/payments" },
          { icon: MapPin, label: "Delivery Addresses", path: "/buyer/dashboard/addresses" },
          { icon: Bell, label: "Notifications", path: "/buyer/dashboard/notifications" },
          { icon: MessageCircle, label: "WhatsApp Ordering", path: "/whatsapp-ordering", action: "whatsapp" },
          { icon: Headphones, label: "Help Center", path: "/help" },
          { icon: Settings, label: "Settings", path: "/buyer/dashboard/settings" },
        ];
`;

const regex = /case "buyer":[\s\S]*?\];/;
if (regex.test(code)) {
    code = code.replace(regex, replacement.trim());
    fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
    console.log("Patched!");
} else {
    console.log("Could not find buyer block");
}
