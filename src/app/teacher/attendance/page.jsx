"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, DataTable } from "@/components/dashboard/dashboard-ui";
import { Calendar } from "@/components/dashboard/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  toISODate,
  getAttendanceForDate,
  getAttendanceForMonth,
  summarize,
} from "@/lib/mock-data";
import { exportToExcel, exportToPdf } from "@/lib/export";

const EXPORT_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "student", label: "Student" },
  { key: "section", label: "Section" },
  { key: "timeIn", label: "Time In" },
  { key: "status", label: "Status" },
];

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "monthly", label: "Monthly" },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SUMMARY_CHIPS = [
  { key: "present", label: "Present", className: "bg-emerald-100 text-emerald-700" },
  { key: "late", label: "Late", className: "bg-amber-100 text-amber-700" },
  { key: "absent", label: "Absent", className: "bg-red-100 text-red-700" },
  { key: "excused", label: "Excused", className: "bg-sky-100 text-sky-700" },
];

export default function AttendanceRecordPage() {
  const [selected, setSelected] = useState(() => toISODate(new Date()));
  const [period, setPeriod] = useState("daily");

  const isMonthly = period === "monthly";

  const d = new Date(`${selected}T00:00:00`);
  const year = d.getFullYear();
  const monthIndex = d.getMonth();

  const records = isMonthly
    ? getAttendanceForMonth(year, monthIndex)
    : getAttendanceForDate(selected);
  const summary = summarize(records);

  const dayLabel = d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const monthLabel = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const recordsLabel = isMonthly ? monthLabel : dayLabel;

  // Move to a different month/year (keeps the day at the 1st).
  const goToMonth = (m, y = year) => setSelected(toISODate(new Date(y, m, 1)));

  const handleExport = (kind) => {
    if (records.length === 0) {
      toast.error("No attendance records for the selected period.");
      return;
    }
    const name = isMonthly
      ? `attendance-${year}-${String(monthIndex + 1).padStart(2, "0")}`
      : `attendance-${selected}`;
    const title = `Attendance Report — ${recordsLabel}`;

    if (kind === "excel") {
      exportToExcel(name, EXPORT_COLUMNS, records);
      toast.success(`Excel exported (${records.length} records).`);
    } else {
      exportToPdf(title, EXPORT_COLUMNS, records);
      toast.success("Opening printable PDF…");
    }
  };

  const tableColumns = isMonthly
    ? [
        { key: "date", label: "Date" },
        { key: "student", label: "Student" },
        { key: "timeIn", label: "Time In" },
        { key: "status", label: "Status", badge: true },
      ]
    : [
        { key: "student", label: "Student" },
        { key: "section", label: "Section" },
        { key: "timeIn", label: "Time In" },
        { key: "status", label: "Status", badge: true },
      ];

  return (
    <>
      <PageHeader
        title="Attendance Record"
        subtitle="View attendance by day or month, and export to Excel or PDF."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Picker: calendar (daily) or month grid (monthly) */}
        <Card className="h-fit">
          <CardHeader>
            <h2 className="font-heading text-base font-semibold text-foreground">
              {isMonthly ? "Select month" : "Select date"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isMonthly
                ? "Pick a month to view and export."
                : "Tap any day to view its attendance."}
            </p>
          </CardHeader>
          <CardContent>
            {isMonthly ? (
              <div className="space-y-3">
                {/* Year navigation */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => goToMonth(monthIndex, year - 1)}
                    aria-label="Previous year"
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-foreground"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <span className="text-sm font-semibold text-foreground">{year}</span>
                  <button
                    type="button"
                    onClick={() => goToMonth(monthIndex, year + 1)}
                    aria-label="Next year"
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-foreground"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
                {/* Month grid */}
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => goToMonth(i)}
                      className={cn(
                        "rounded-lg px-2 py-2.5 text-sm font-medium transition-colors",
                        i === monthIndex
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-foreground"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <Calendar selected={selected} onSelect={setSelected} />
            )}
          </CardContent>
        </Card>

        {/* Records + export */}
        <div className="space-y-5">
          {/* Export bar */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">View:</span>
                <div className="inline-flex rounded-full bg-slate-100 p-1">
                  {PERIODS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPeriod(p.key)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        period === p.key
                          ? "bg-white text-primary shadow-sm"
                          : "text-slate-500 hover:text-foreground"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="size-4" />
                  Excel
                </Button>
                <Button size="sm" onClick={() => handleExport("pdf")}>
                  <FileText className="size-4" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary + table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold text-foreground">
                {recordsLabel}
              </h2>
              {records.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {SUMMARY_CHIPS.map((c) => (
                    <span
                      key={c.key}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        c.className
                      )}
                    >
                      {c.label}: {summary[c.key]}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <DataTable
              columns={tableColumns}
              rows={records}
              empty={
                isMonthly
                  ? "No records for this month."
                  : "No classes on this day (weekend) or no records found."
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
