"use client";

import Link from "next/link";
import { UserCheck, Clock, UserX, FileSpreadsheet, AlertTriangle, Bell } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader, StatCard, DataTable, StatusBadge } from "@/components/dashboard/dashboard-ui";
import { ATTENDANCE_RECORDS, ATTENDANCE_SUMMARY, CASES, STUDENT_ROSTER } from "@/lib/mock-data";
import { getStudentStanding } from "@/lib/students";
import { buttonVariants } from "@/components/ui/button";

const PRIORITY_DOT = {
  High: "bg-red-500",
  Medium: "bg-amber-400",
  Low: "bg-slate-400",
};

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const firstName = user.name.split(" ")[0];
  const needsAttention = CASES.filter((c) => c.status !== "Resolved");

  // Auto-detect at-risk students from attendance data who don't yet have an active case.
  const caseStudentNames = new Set(needsAttention.map((c) => c.student));
  const attendanceAlerts = STUDENT_ROSTER
    .map((s) => ({ ...s, standing: getStudentStanding(s.name) }))
    .filter((s) => s.standing.needsAttention && !caseStudentNames.has(s.name));

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

      {attendanceAlerts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h2 className="font-heading text-base font-semibold text-foreground">
              Attendance Alerts
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {attendanceAlerts.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
            {attendanceAlerts.map((s, i) => (
              <Link
                key={s.name}
                href={`/teacher/learners`}
                className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 ${
                  i < attendanceAlerts.length - 1 ? "border-b border-slate-100" : ""
                }`}
              >
                <span className="size-2 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="mx-1.5 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{s.section}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {s.standing.rate}% attendance · {s.standing.absences} absences
                </span>
                <StatusBadge value="Needs attention" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {needsAttention.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            <h2 className="font-heading text-base font-semibold text-foreground">
              Needs Attention
            </h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {needsAttention.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
            {needsAttention.map((c, i) => (
              <Link
                key={c.id}
                href={`/teacher/cases/${c.id}?from=dashboard`}
                className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 ${
                  i < needsAttention.length - 1 ? "border-b border-slate-100" : ""
                }`}
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${PRIORITY_DOT[c.priority] ?? "bg-slate-400"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-foreground">{c.student}</span>
                  <span className="mx-1.5 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{c.type}</span>
                </span>
                <StatusBadge value={c.priority} />
                <StatusBadge value={c.status} />
              </Link>
            ))}
          </div>
        </section>
      )}

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
