"use client";

import { LayoutDashboard, FolderOpen, GraduationCap } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const NAV = [
  { label: "Dashboard", href: "/guidance", icon: LayoutDashboard },
  { label: "Students", href: "/guidance/students", icon: GraduationCap },
  { label: "Cases", href: "/guidance/cases", icon: FolderOpen },
];

export default function GuidanceLayout({ children }) {
  return (
    <DashboardShell role="guidance" navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
