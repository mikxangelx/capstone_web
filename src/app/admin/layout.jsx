"use client";

import { LayoutDashboard, Megaphone, Users, Settings } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }) {
  return (
    <DashboardShell role="admin" navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
