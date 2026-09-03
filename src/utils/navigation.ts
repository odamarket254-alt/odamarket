import {
  Store, Heart, ShoppingCart, Ticket, LayoutDashboard, Inbox, Package, Settings, Users,
  ShieldCheck, FolderTree, FileText, Bell, BarChart, FileEdit, HardDrive, Terminal, List,
  Cpu, MessageSquare, Tags, Archive, Image as ImageIcon, Megaphone, StarHalf, Truck, Gift,
  CreditCard, MapPin, Headphones, MessageCircle
} from "lucide-react";

export const getNavItems = (role: string | undefined, verified?: boolean) => {
  switch (role) {
    case "seller":
      return [
        { icon: LayoutDashboard, label: "Overview", path: "/seller/dashboard" },
        { icon: Inbox, label: "Inquiries", path: "/seller/dashboard/inquiries" },
        { icon: Package, label: "Products", path: "/seller/dashboard/products" },
        { icon: FileText, label: "RFQ Center", path: "/seller/dashboard/rfqs" },
        { icon: Settings, label: "Settings", path: "/seller/dashboard/settings" },
      ];
    case "super_admin":
    case "moderator":
    case "support_agent":
    case "content_manager":
    case "admin": {
      const baseAdminNav = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
        { icon: Users, label: "Users", path: "/admin/dashboard/users" },
        { icon: Package, label: "Products", path: "/admin/dashboard/products" },
        { icon: Inbox, label: "Orders", path: "/admin/dashboard/orders" },
        { icon: FileText, label: "Discounts & Coupons", path: "/admin/dashboard/discounts" },
        { icon: FolderTree, label: "Categories", path: "/admin/dashboard/categories" },
        { icon: Tags, label: "Brands", path: "/admin/dashboard/brands" },
        { icon: Archive, label: "Inventory", path: "/admin/dashboard/inventory" },
        { icon: Megaphone, label: "Marketing Center", path: "/admin/dashboard/marketing" },
        { icon: MessageSquare, label: "Support", path: "/admin/dashboard/support" },
        { icon: StarHalf, label: "Reviews", path: "/admin/dashboard/reviews" },
        { icon: FileEdit, label: "CMS (Content)", path: "/admin/dashboard/content" },
        { icon: ImageIcon, label: "Media Library", path: "/admin/dashboard/media" },
        { icon: BarChart, label: "Analytics", path: "/admin/dashboard/reports" },
      ];
      if (role === "super_admin") {
        baseAdminNav.push(
          { icon: Cpu, label: "AI Management", path: "/admin/dashboard/ai" },
          { icon: Bell, label: "Notification Center", path: "/admin/dashboard/notifications" },
          { icon: ShieldCheck, label: "Security Center", path: "/admin/dashboard/security" },
          { icon: HardDrive, label: "Storage Management", path: "/admin/dashboard/storage" },
          { icon: Terminal, label: "Developer Tools", path: "/admin/dashboard/developer" },
          { icon: List, label: "Audit Logs", path: "/admin/dashboard/audit" },
          { icon: Settings, label: "System Settings", path: "/admin/dashboard/settings" }
        );
      } else if (role === "admin") {
        baseAdminNav.push({ icon: Settings, label: "Settings", path: "/admin/dashboard/settings" });
      }
      return baseAdminNav;
    }
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
        { icon: MessageCircle, label: "WhatsApp Ordering", path: "/buyer/dashboard/whatsapp-ordering" },
        { icon: Headphones, label: "Help Center", path: "/help-center" },
        { icon: Settings, label: "Settings", path: "/buyer/dashboard/settings" },
      ];
  }
};
