"use client";

import Link from "next/link";
import { UserCheck, Clock, UserX, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader, StatCard, DataTable } from "@/components/dashboard/dashboard-ui";
import { ATTENDANCE_RECORDS, ATTENDANCE_SUMMARY } from "@/lib/mock-data";
import { buttonVariants } from "@/components/ui/button";

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const firstName = user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        subtitle="Today's attendance at a glance."
        actions={
          <Link
            href="/teacher/reports"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            <FileSpreadsheet className="size-4" />
            Reports
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={UserCheck} label="Present" value={ATTENDANCE_SUMMARY.present} tone="success" />
        <StatCard icon={Clock} label="Late" value={ATTENDANCE_SUMMARY.late} tone="warning" />
        <StatCard icon={UserX} label="Absent" value={ATTENDANCE_SUMMARY.absent} tone="danger" />
        <StatCard icon={UserCheck} label="Excused" value={ATTENDANCE_SUMMARY.excused} tone="info" />
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Today&apos;s record
        </h2>
        <DataTable
          columns={[
            { key: "student", label: "Student" },
            { key: "section", label: "Section" },
            { key: "timeIn", label: "Time In" },
            { key: "status", label: "Status", badge: true },
          ]}
          rows={ATTENDANCE_RECORDS.filter((r) => r.date === "2026-06-18")}
        />
      </section>
    </>
  );
}
