"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react";
import { NAV_ITEMS, ADMIN_NAV_ITEMS, filterNavItems, type FeatureKey } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/sheets/schema/common";

function NavLink({
  href,
  label,
  icon: Icon,
  collapsed,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export function Sidebar({
  role = null,
  enabledFeatures = null,
}: {
  role?: Role | null;
  enabledFeatures?: Record<FeatureKey, boolean> | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/admin"));

  const navItems = filterNavItems(NAV_ITEMS, role, enabledFeatures);
  const adminItems = filterNavItems(ADMIN_NAV_ITEMS, role, enabledFeatures);

  return (
    <aside
      className={cn(
        "hidden md:flex h-svh flex-col border-r border-border bg-sidebar transition-[width] duration-200 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          P
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-foreground">
            Picapool CRM
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}

        {adminItems.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setAdminOpen((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent",
                collapsed && "justify-center px-2"
              )}
            >
              {!collapsed && <span>Admin</span>}
              {!collapsed && (
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", adminOpen && "rotate-180")}
                />
              )}
            </button>
            {(adminOpen || collapsed) && (
              <div className="mt-1 space-y-1">
                {adminItems.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    collapsed={collapsed}
                    active={pathname === item.href || pathname.startsWith(item.href + "/")}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
