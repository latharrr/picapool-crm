import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Phone,
  Contact,
  CheckSquare,
  Megaphone,
  Home,
  MessageSquare,
  Bell,
  Shield,
  UserCog,
  Building2,
  Settings,
  Activity,
} from "lucide-react";

export type Permission =
  | "VIEW"
  | "EDIT"
  | "DELETE"
  | "IMPORT"
  | "EXPORT"
  | "CALL"
  | "SEND_WHATSAPP"
  | "SEND_EMAIL"
  | "MANAGE_USERS"
  | "VIEW_ANALYTICS"
  | "MANAGE_SETTINGS";

export type FeatureKey =
  | "calling"
  | "housing"
  | "campaigns"
  | "messages"
  | "analytics"
  | "tasks";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  feature?: FeatureKey;
  permission?: Permission;
  /** Shown in the mobile bottom nav (max 5 recommended). */
  mobilePrimary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: "VIEW_ANALYTICS",
    mobilePrimary: true,
  },
  { href: "/leads", label: "Leads", icon: Users, permission: "VIEW", mobilePrimary: true },
  {
    href: "/calling",
    label: "Calling",
    icon: Phone,
    feature: "calling",
    permission: "CALL",
    mobilePrimary: true,
  },
  { href: "/contacts", label: "Contacts", icon: Contact, permission: "VIEW" },
  {
    href: "/tasks",
    label: "Tasks",
    icon: CheckSquare,
    feature: "tasks",
    permission: "VIEW",
    mobilePrimary: true,
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: Megaphone,
    feature: "campaigns",
    permission: "VIEW",
  },
  { href: "/housing", label: "Housing", icon: Home, feature: "housing", permission: "VIEW" },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageSquare,
    feature: "messages",
    permission: "VIEW",
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    permission: "VIEW",
    mobilePrimary: true,
  },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: UserCog, permission: "MANAGE_USERS" },
  { href: "/admin/roles", label: "Roles & Permissions", icon: Shield, permission: "MANAGE_USERS" },
  {
    href: "/admin/workspaces",
    label: "Workspaces",
    icon: Building2,
    permission: "MANAGE_SETTINGS",
  },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "MANAGE_SETTINGS" },
  { href: "/admin/system", label: "System Health", icon: Activity, permission: "MANAGE_SETTINGS" },
];
