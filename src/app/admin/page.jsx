"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Users, GraduationCap, UserCheck, AlertTriangle, Megaphone } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader, StatCard, DataTable } from "@/components/dashboard/dashboard-ui";
import { CASES, ATTENDANCE_SUMMARY } from "@/lib/mock-data";
import {
  getUsers,
  getServerUsers,
  subscribe,
  isStudent,
  isEmployee,
} from "@/lib/users";
import { buttonVariants } from "@/components/ui/button";

function useUsers() {
  return useSyncExternalStore(subscribe, getUsers, getServerUsers);
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const users = useUsers();

  const employees = useMemo(() => users.filter(isEmployee), [users]);
  const students = useMemo(() => users.filter(isStudent), [users]);

  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        subtitle="System overview for the attendance monitoring system."
        actions={
          <Link href="/admin/announcements" className={buttonVariants({ size: "sm" })}>
            <Megaphone className="size-4" />
            New Announcement
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Employees" value={employees.length} tone="primary" />
        <StatCard icon={GraduationCap} label="Students" value={students.length} tone="info" />
        <StatCard
          icon={UserCheck}
          label="Present today"
          value={ATTENDANCE_SUMMARY.present}
          tone="success"
        />
        <StatCard
          icon={AlertTriangle}
          label="Open cases"
          value={CASES.filter((c) => c.status !== "Resolved").length}
          tone="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Employees
            </h2>
            <Link
              href="/admin/users"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Manage
            </Link>
          </div>
          <DataTable
            columns={[
              { key: "name", label: "Name" },
              { key: "role", label: "Role" },
              { key: "status", label: "Status", badge: true },
            ]}
            rows={employees.slice(0, 5)}
            empty="No employees yet."
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Students
            </h2>
            <Link
              href="/admin/users"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Manage
            </Link>
          </div>
          <DataTable
            columns={[
              { key: "name", label: "Name" },
              { key: "section", label: "Section" },
              { key: "status", label: "Status", badge: true },
            ]}
            rows={students.slice(0, 5)}
            empty="No students yet."
          />
        </section>
      </div>
    </>
  );
}
