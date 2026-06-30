"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { FileSpreadsheet, FileText, GraduationCap, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, DataTable, StatusBadge } from "@/components/dashboard/dashboard-ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ATTENDANCE_RECORDS, CASES } from "@/lib/mock-data";
import { exportToExcel, exportToPdf } from "@/lib/export";
import { getStudentStanding } from "@/lib/students";
import { getUsers, getServerUsers, subscribe, isStudent } from "@/lib/users";

const CURRENT_YEAR = "2025–2026";
const YEAR_DAYS = 300;

const ATTENDANCE_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "student", label: "Student" },
  { key: "section", label: "Section" },
  { key: "timeIn", label: "Time In" },
  { key: "status", label: "Status" },
];

const YEAREND_EXPORT_COLUMNS = [
  { key: "name", label: "Student" },
  { key: "section", label: "Section" },
  { key: "rate", label: "Attendance Rate" },
  { key: "absences", label: "Absences" },
  { key: "lates", label: "Late Arrivals" },
  { key: "excused", label: "Excused" },
  { key: "cases", label: "Cases" },
  { key: "standing", label: "Standing" },
];

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-white text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState("attendance");
  const users = useSyncExternalStore(subscribe, getUsers, getServerUsers);
  const students = useMemo(() => users.filter(isStudent), [users]);

  const yearRows = useMemo(() =>
    students.map((s) => {
      const standing = getStudentStanding(s.name, YEAR_DAYS);
      const caseCount = CASES.filter((c) => c.student === s.name).length;
      return {
        id: s.id,
        name: s.name,
        section: s.section ?? "—",
        rate: `${standing.rate}%`,
        rateNum: standing.rate,
        absences: standing.counts.absent,
        lates: standing.counts.late,
        excused: standing.counts.excused,
        cases: caseCount,
        standing: standing.needsAttention ? "Needs attention" : "Good standing",
      };
    }),
    [students]
  );

  const avgRate = yearRows.length
    ? Math.round(yearRows.reduce((s, r) => s + r.rateNum, 0) / yearRows.length)
    : 0;
  const atRisk = yearRows.filter((r) => r.standing === "Needs attention").length;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Export attendance records for record-keeping."
      />

      <div className="flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
        <TabButton active={tab === "attendance"} onClick={() => setTab("attendance")}>
          Attendance
        </TabButton>
        <TabButton active={tab === "yearend"} onClick={() => setTab("yearend")}>
          Year-End Summary
        </TabButton>
      </div>

      {tab === "attendance" && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-base font-semibold text-foreground">
                  Attendance report preview
                </h2>
                <p className="text-sm text-muted-foreground">
                  {ATTENDANCE_RECORDS.length} records · export to Excel or PDF.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportToExcel("attendance-report", ATTENDANCE_COLUMNS, ATTENDANCE_RECORDS);
                    toast.success("Excel file downloaded.");
                  }}
                >
                  <FileSpreadsheet className="size-4" />
                  Export Excel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    exportToPdf("Attendance Report", ATTENDANCE_COLUMNS, ATTENDANCE_RECORDS);
                    toast.success("Opening printable PDF…");
                  }}
                >
                  <FileText className="size-4" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[...ATTENDANCE_COLUMNS.slice(0, 4), { key: "status", label: "Status", badge: true }]}
              rows={ATTENDANCE_RECORDS}
            />
          </CardContent>
        </Card>
      )}

      {tab === "yearend" && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="size-5" />
                </span>
                <div className="leading-tight">
                  <p className="text-2xl font-bold text-foreground">{yearRows.length}</p>
                  <p className="text-xs text-muted-foreground">Total students</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <TrendingUp className="size-5" />
                </span>
                <div className="leading-tight">
                  <p className="text-2xl font-bold text-foreground">{avgRate}%</p>
                  <p className="text-xs text-muted-foreground">Avg. attendance rate</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="size-5" />
                </span>
                <div className="leading-tight">
                  <p className="text-2xl font-bold text-foreground">{atRisk}</p>
                  <p className="text-xs text-muted-foreground">At-risk students</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    School Year {CURRENT_YEAR} Summary
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Per-student attendance for the full school year.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      exportToExcel(`year-end-${CURRENT_YEAR}`, YEAREND_EXPORT_COLUMNS, yearRows);
                      toast.success("Excel file downloaded.");
                    }}
                  >
                    <FileSpreadsheet className="size-4" />
                    Export Excel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      exportToPdf(`Year-End Summary ${CURRENT_YEAR}`, YEAREND_EXPORT_COLUMNS, yearRows);
                      toast.success("Opening printable PDF…");
                    }}
                  >
                    <FileText className="size-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: "name", label: "Student" },
                  { key: "section", label: "Section" },
                  { key: "rate", label: "Attendance Rate" },
                  { key: "absences", label: "Absences" },
                  { key: "lates", label: "Late Arrivals" },
                  { key: "excused", label: "Excused" },
                  { key: "cases", label: "Cases" },
                  {
                    key: "standing",
                    label: "Standing",
                    render: (row) => <StatusBadge value={row.standing} />,
                  },
                ]}
                rows={yearRows}
                empty="No students found."
              />
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
