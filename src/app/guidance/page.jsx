"use client";

import { FolderOpen, CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { PageHeader, StatCard, DataTable } from "@/components/dashboard/dashboard-ui";
import { CASES, CONFERENCES } from "@/lib/mock-data";

export default function GuidanceDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const firstName = user.name.split(" ")[0];
  const openCases = CASES.filter((c) => c.status !== "Resolved");
  const upcoming = CONFERENCES.filter(
    (c) => c.status === "Scheduled" || c.status === "Confirmed"
  );

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        subtitle="Counseling cases and conference overview."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FolderOpen} label="Open cases" value={openCases.length} tone="warning" />
        <StatCard
          icon={AlertTriangle}
          label="High priority"
          value={CASES.filter((c) => c.priority === "High").length}
          tone="danger"
        />
        <StatCard icon={CalendarClock} label="Upcoming conferences" value={upcoming.length} tone="info" />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={CASES.filter((c) => c.status === "Resolved").length}
          tone="success"
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Upcoming conferences
        </h2>
        <DataTable
          columns={[
            { key: "date", label: "Date" },
            { key: "time", label: "Time" },
            { key: "student", label: "Student" },
            { key: "parent", label: "Parent/Guardian" },
            { key: "status", label: "Status", badge: true },
          ]}
          rows={upcoming}
          empty="No upcoming conferences."
        />
      </section>
    </>
  );
}
