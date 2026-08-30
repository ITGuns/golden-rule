import {
  BarChart3,
  Bot,
  Calendar,
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  Newspaper,
  PhoneMissed,
  ScrollText,
  Settings,
  Star,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = { label: string; href: string; icon: LucideIcon };
export type AdminNavSection = { title: string; items: AdminNavItem[] };

/** Sidebar + command palette navigation. Hrefs are the canonical admin routes. */
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Pipeline",
    items: [
      { label: "Leads", href: "/admin/leads", icon: Inbox },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Appointments", href: "/admin/appointments", icon: Calendar },
      { label: "Service Requests", href: "/admin/service-requests", icon: ClipboardList },
      { label: "Estimates", href: "/admin/estimates", icon: FileText },
    ],
  },
  {
    title: "Reputation",
    items: [
      { label: "Reviews", href: "/admin/reviews", icon: Star },
      { label: "Missed Calls", href: "/admin/missed-calls", icon: PhoneMissed },
      { label: "Chatbot", href: "/admin/chatbot", icon: Bot },
    ],
  },
  {
    title: "Website",
    items: [
      { label: "Content", href: "/admin/content", icon: Newspaper },
      { label: "Services", href: "/admin/services", icon: Wrench },
    ],
  },
  {
    title: "Organization",
    items: [
      { label: "Team", href: "/admin/team", icon: UserCog },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Audit Log", href: "/admin/audit", icon: ScrollText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_SECTIONS.flatMap((s) => s.items);

/** Quick-create actions surfaced in the command palette. */
export const QUICK_ACTIONS: AdminNavItem[] = [
  { label: "Create Lead", href: "/admin/leads?new=1", icon: Inbox },
  { label: "Create Appointment", href: "/admin/appointments?new=1", icon: Calendar },
  { label: "New Article", href: "/admin/content?new=1", icon: Newspaper },
];
