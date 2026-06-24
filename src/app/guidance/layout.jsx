"use client";

import { LayoutDashboard, FolderOpen, GraduationCap, CalendarClock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const NAV = [
  { label: "Dashboard", href: "/guidance", icon: LayoutDashboard },
  { label: "Students", href: "/guidance/students", icon: GraduationCap },
  { label: "Cases", href: "/guidance/cases", icon: FolderOpen },
  { label: "Scheduled Conference", href: "/guidance/conferences", icon: CalendarClock },
];

export default function GuidanceLayout({ children }) {
  return (
    <DashboardShell role="guidance" navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
