"use client";

import { LayoutDashboard, CalendarClock, GraduationCap } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const NAV = [
  { label: "Dashboard", href: "/guidance", icon: LayoutDashboard },
  { label: "Conferences", href: "/guidance/conferences", icon: CalendarClock },
  { label: "Students", href: "/guidance/students", icon: GraduationCap },
];

export default function GuidanceLayout({ children }) {
  return (
    <DashboardShell role="guidance" navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
