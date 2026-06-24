"use client";

import {
  LayoutDashboard,
  BookOpen,
  Music,
  ClipboardList,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const NAV = [
  {
    heading: "Home",
    items: [{ label: "Dashboard", href: "/teacher", icon: LayoutDashboard }],
  },
  {
    heading: "Attendance",
    items: [
      {
        label: "Homeroom Subjects",
        icon: BookOpen,
        dot: "green",
        collapsible: true,
        children: [
          { label: "English (Gumamela)", href: "/teacher/subjects/english", icon: BookOpen },
          { label: "Music (Gumamela)", href: "/teacher/subjects/music", icon: Music },
        ],
      },
      { label: "Attendance Records", href: "/teacher/attendance", icon: ClipboardList },
    ],
  },
  {
    heading: "Students & Reports",
    items: [
      { label: "Learner Status", href: "/teacher/learners", icon: UserCheck },
      { label: "Reports", href: "/teacher/reports", icon: FileSpreadsheet },
    ],
  },
];

export default function TeacherLayout({ children }) {
  return (
    <DashboardShell role="teacher" navItems={NAV}>
      {children}
    </DashboardShell>
  );
}
