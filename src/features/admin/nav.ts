import {
  Award,
  ClipboardList,
  FileText,
  FolderTree,
  Inbox,
  LayoutDashboard,
  Newspaper,
  Package,
  Settings,
  Truck,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  ready: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, ready: true },
  { href: "/admin/quotations", label: "Quotations", icon: ClipboardList, ready: true },
  { href: "/admin/inquiries", label: "Messages", icon: Inbox, ready: true },
  { href: "/admin/orders", label: "Orders", icon: Truck, ready: true },
  { href: "/admin/products", label: "Products", icon: Package, ready: true },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, ready: true },
  { href: "/admin/certifications", label: "Certifications", icon: Award, ready: true },
  { href: "/admin/content", label: "Website content", icon: FileText, ready: true },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, ready: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, ready: true },
];
