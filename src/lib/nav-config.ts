import type { LucideIcon } from "lucide-react";
import { hasPermission } from "@/lib/auth/rbac";
import type { Role, PermissionName } from "@/lib/sheets/schema/common";
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
  History,
  Sparkles,
} from "lucide-react";

export type Permission = PermissionName;

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
  {
    href: "/assistant",
    label: "AI Assistant",
    icon: Sparkles,
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
  { href: "/admin/activity", label: "Activity Log", icon: History, permission: "MANAGE_SETTINGS" },
  { href: "/admin/system", label: "System Health", icon: Activity, permission: "MANAGE_SETTINGS" },
];

/**
 * Frontend-only visibility filter (UX sugar, not authorization — every page
 * re-checks permissions server-side). `role` is the user's global role;
 * `enabledFeatures` is the active workspace's feature-flag map, or null
 * when there's no active workspace (in which case feature gating is
 * skipped and only permission-based hiding applies).
 */
export function filterNavItems(
  items: NavItem[],
  role: Role | null,
  enabledFeatures: Record<FeatureKey, boolean> | null
): NavItem[] {
  return items.filter((item) => {
    if (item.permission && role && !hasPermission(role, item.permission)) return false;
    if (item.feature && enabledFeatures && enabledFeatures[item.feature] === false) return false;
    return true;
  });
}
