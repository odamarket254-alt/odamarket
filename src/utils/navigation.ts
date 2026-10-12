import {
  Store, Heart, ShoppingCart, Ticket, LayoutDashboard, Inbox, Package, Settings, Users,
  ShieldCheck, FolderTree, FileText, Bell, BarChart, FileEdit, HardDrive, Terminal, List,
  Cpu, MessageSquare, Tags, Archive, Image as ImageIcon, Megaphone, StarHalf, Truck, Gift,
  CreditCard, MapPin, Headphones, MessageCircle
} from "lucide-react";

export const getNavItems = (
  role: string | undefined,
  verified?: boolean,
  t?: (key: string, fallback?: string) => string
) => {
  const tr = (key: string, fallback: string) => (t ? t(key, fallback) : fallback);

  switch (role) {
    case "seller":
      return [
        { icon: LayoutDashboard, label: tr("dashboard.overview", "Overview"), path: "/seller/dashboard" },
        { icon: Inbox, label: tr("seller.inquiries", "Inquiries"), path: "/seller/dashboard/inquiries" },
        { icon: Package, label: tr("seller.products", "Products"), path: "/seller/dashboard/products" },
        { icon: FileText, label: tr("seller.rfqs", "RFQ Center"), path: "/seller/dashboard/rfqs" },
        { icon: Settings, label: tr("dashboard.settings", "Settings"), path: "/seller/dashboard/settings" },
      ];
    case "super_admin":
    case "moderator":
    case "support_agent":
    case "content_manager":
    case "admin": {
      const baseAdminNav = [
        { icon: LayoutDashboard, label: tr("dashboard.overview", "Dashboard"), path: "/admin/dashboard" },
        { icon: Users, label: tr("admin.users", "Users"), path: "/admin/dashboard/users" },
        { icon: Package, label: tr("seller.products", "Products"), path: "/admin/dashboard/products" },
        { icon: Inbox, label: tr("dashboard.my_orders", "Orders"), path: "/admin/dashboard/orders" },
        { icon: FileText, label: tr("dashboard.coupons", "Discounts & Coupons"), path: "/admin/dashboard/discounts" },
        { icon: FolderTree, label: tr("nav.categories", "Categories"), path: "/admin/dashboard/categories" },
        { icon: Tags, label: tr("admin.brands", "Brands"), path: "/admin/dashboard/brands" },
        { icon: Archive, label: tr("admin.inventory", "Inventory"), path: "/admin/dashboard/inventory" },
        { icon: Megaphone, label: tr("admin.marketing", "Marketing Center"), path: "/admin/dashboard/marketing" },
        { icon: MessageSquare, label: tr("admin.support", "Support"), path: "/admin/dashboard/support" },
        { icon: StarHalf, label: tr("product.reviews", "Reviews"), path: "/admin/dashboard/reviews" },
        { icon: FileEdit, label: tr("admin.content", "CMS (Content)"), path: "/admin/dashboard/content" },
        { icon: ImageIcon, label: tr("admin.media", "Media Library"), path: "/admin/dashboard/media" },
        { icon: BarChart, label: tr("admin.analytics", "Analytics"), path: "/admin/dashboard/reports" },
      ];
      if (role === "super_admin") {
        baseAdminNav.push(
          { icon: Cpu, label: "AI Management", path: "/admin/dashboard/ai" },
          { icon: Bell, label: tr("dashboard.notifications", "Notification Center"), path: "/admin/dashboard/notifications" },
          { icon: ShieldCheck, label: "Security Center", path: "/admin/dashboard/security" },
          { icon: HardDrive, label: "Storage Management", path: "/admin/dashboard/storage" },
          { icon: Terminal, label: "Developer Tools", path: "/admin/dashboard/developer" },
          { icon: List, label: "Audit Logs", path: "/admin/dashboard/audit" },
          { icon: Settings, label: tr("dashboard.settings", "System Settings"), path: "/admin/dashboard/settings" }
        );
      } else if (role === "admin") {
        baseAdminNav.push({ icon: Settings, label: tr("dashboard.settings", "Settings"), path: "/admin/dashboard/settings" });
      }
      return baseAdminNav;
    }
    case "buyer":
    case "customer":
    default:
      return [
        { icon: LayoutDashboard, label: tr("dashboard.overview", "Dashboard"), path: "/buyer/dashboard" },
        { icon: Store, label: tr("nav.shop", "Shop"), path: "/products" },
        { icon: FolderTree, label: tr("nav.categories", "Categories"), path: "/categories" },
        { icon: Package, label: tr("dashboard.my_orders", "My Orders"), path: "/buyer/dashboard/orders" },
        { icon: Truck, label: tr("dashboard.track_delivery", "Track Delivery"), path: "/buyer/dashboard/track" },
        { icon: Heart, label: tr("nav.wishlist", "Wishlist"), path: "/wishlist" },
        { icon: ShoppingCart, label: tr("nav.cart", "Shopping Cart"), path: "/cart" },
        { icon: Gift, label: tr("dashboard.rewards", "Rewards"), path: "/buyer/dashboard/rewards" },
        { icon: Ticket, label: tr("dashboard.coupons", "Coupons"), path: "/buyer/dashboard/coupons" },
        { icon: CreditCard, label: tr("dashboard.payments", "Payment Methods"), path: "/buyer/dashboard/payments" },
        { icon: MapPin, label: tr("dashboard.addresses", "Delivery Addresses"), path: "/buyer/dashboard/addresses" },
        { icon: Bell, label: tr("dashboard.notifications", "Notifications"), path: "/buyer/dashboard/notifications" },
        { icon: MessageCircle, label: tr("nav.whatsapp_ordering", "WhatsApp Ordering"), path: "/buyer/dashboard/whatsapp-ordering" },
        { icon: Headphones, label: tr("nav.help_center", "Help Center"), path: "/help-center" },
        { icon: Settings, label: tr("dashboard.settings", "Settings"), path: "/buyer/dashboard/settings" },
      ];
  }
};
