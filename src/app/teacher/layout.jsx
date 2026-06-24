"use client";

import {
  LayoutDashboard,
  BookOpen,
  Music,
  ClipboardList,
  CalendarClock,
  UserCheck,
  QrCode,
  FileSpreadsheet,
  ChartColumn,
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
    ],
  },
  {
    heading: "Attendance History",
    items: [
      { label: "Attendance Records", href: "/teacher/attendance", icon: ClipboardList },
      { label: "Attendance Sessions", href: "/teacher/sessions", icon: CalendarClock },
    ],
  },
  {
    heading: "Student Management",
    items: [
      { label: "Learner Status", href: "/teacher/learners", icon: UserCheck },
      { label: "Student QR Codes", href: "/teacher/qr-codes", icon: QrCode },
    ],
  },
  {
    heading: "Reports",
    items: [
      { label: "SF2 Report Form", href: "/teacher/reports", icon: FileSpreadsheet },
      { label: "Summary Attendance", href: "/teacher/summary", icon: ChartColumn, dot: "blue" },
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
