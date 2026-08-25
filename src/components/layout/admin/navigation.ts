import {
  LayoutDashboard,
  Globe,
  Package,
  Archive,
  ShoppingCart,
  Users,
  Megaphone,
  CreditCard,
  UserCheck,
  Settings,
  ClipboardList,
  Headset
} from "lucide-react";

export interface NavItem {
  label: string;
  path?: string;
  icon?: any;
  roles: string[];
  id?: string;
  children?: { label: string; path: string }[];
}

export const ADMIN_NAVIGATION: NavItem[] = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "manager", "admin", "cashier", "warehouse_staff"]
  },
  {
    label: "Customer Support",
    id: "customer_support",
    path: "/admin/dashboard/support",
    icon: Headset,
    roles: ["super_admin", "manager", "admin", "support_agent"]
  },
  {
    label: "Homepage CMS",
    icon: Globe,
    roles: ["super_admin", "manager", "admin"],
    children: [
      { label: "Hero", path: "/admin/dashboard/storefront?tab=hero" },
      { label: "Navigation", path: "/admin/dashboard/storefront?tab=navigation" },
      { label: "Banners", path: "/admin/dashboard/storefront?tab=banners" },
      { label: "Featured Products", path: "/admin/dashboard/storefront?tab=featured" },
      { label: "Categories", path: "/admin/dashboard/categories" },
      { label: "Brands", path: "/admin/dashboard/brands" },
      { label: "Statistics", path: "/admin/dashboard/storefront?tab=statistics" },
      { label: "Testimonials", path: "/admin/dashboard/storefront?tab=testimonials" },
      { label: "Footer", path: "/admin/dashboard/storefront?tab=footer" }
    ]
  },
  {
    label: "Products",
    icon: Package,
    roles: ["super_admin", "manager", "admin"],
    children: [
      { label: "Products", path: "/admin/dashboard/products" },
      { label: "Wholesale Products", path: "/admin/dashboard/wholesale" },
      { label: "Categories", path: "/admin/dashboard/categories" },
      { label: "Subcategories", path: "/admin/dashboard/subcategories" },
      { label: "Brands", path: "/admin/dashboard/brands" },
      { label: "Variants", path: "/admin/dashboard/variants" },
      { label: "Reviews", path: "/admin/dashboard/reviews" }
    ]
  },
  {
    label: "Inventory",
    icon: Archive,
    roles: ["super_admin", "manager", "admin", "warehouse_staff"],
    children: [
      { label: "Inventory", path: "/admin/dashboard/inventory" },
      { label: "Warehouses", path: "/admin/dashboard/warehouses" },
      { label: "Stock Transfers", path: "/admin/dashboard/transfers" },
      { label: "Stock Adjustments", path: "/admin/dashboard/adjustments" },
      { label: "Suppliers", path: "/admin/dashboard/suppliers" },
      { label: "Purchase Orders", path: "/admin/dashboard/purchase-orders" }
    ]
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    roles: ["super_admin", "manager", "admin", "cashier"],
    children: [
      { label: "Orders", path: "/admin/dashboard/orders" },
      { label: "Payments", path: "/admin/dashboard/payments" },
      { label: "Refunds", path: "/admin/dashboard/refunds" },
      { label: "Deliveries", path: "/admin/dashboard/deliveries" }
    ]
  },
  {
    label: "Customers",
    icon: Users,
    roles: ["super_admin", "manager", "admin"],
    children: [
      { label: "Customers", path: "/admin/dashboard/customers" },
      { label: "Reviews", path: "/admin/dashboard/reviews" },
      { label: "Wishlists", path: "/admin/dashboard/wishlists" }
    ]
  },
  {
    label: "Marketing",
    icon: Megaphone,
    roles: ["super_admin", "manager", "admin"],
    children: [
      { label: "Coupons", path: "/admin/dashboard/discounts" },
      { label: "Flash Sales", path: "/admin/dashboard/flash-sales" },
      { label: "Campaigns", path: "/admin/dashboard/marketing" }
    ]
  },
  {
    label: "Finance",
    icon: CreditCard,
    roles: ["super_admin", "manager", "admin"],
    children: [
      { label: "Revenue", path: "/admin/dashboard/finance/revenue" },
      { label: "Expenses", path: "/admin/dashboard/finance/expenses" },
      { label: "Reports", path: "/admin/dashboard/reports" }
    ]
  },
  {
    label: "Staff",
    icon: UserCheck,
    roles: ["super_admin", "admin"],
    children: [
      { label: "Employees", path: "/admin/dashboard/staff/employees" },
      { label: "Roles", path: "/admin/dashboard/staff/roles" },
      { label: "Permissions", path: "/admin/dashboard/staff/permissions" }
    ]
  },
  {
    label: "Settings",
    path: "/admin/dashboard/settings",
    icon: Settings,
    roles: ["super_admin", "manager", "admin"]
  },
  {
    label: "Audit Logs",
    path: "/admin/dashboard/audit",
    icon: ClipboardList,
    roles: ["super_admin", "admin"]
  }
];
