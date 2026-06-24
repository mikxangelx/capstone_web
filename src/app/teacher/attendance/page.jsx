"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
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
  getAttendanceForYear,
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
  { key: "yearly", label: "Yearly" },
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

  const dayRecords = useMemo(() => getAttendanceForDate(selected), [selected]);
  const summary = useMemo(() => summarize(dayRecords), [dayRecords]);

  const selectedDateLabel = new Date(`${selected}T00:00:00`).toLocaleDateString(
    undefined,
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );

  // Build the rows + filename + title for the chosen export period.
  const buildExport = () => {
    const d = new Date(`${selected}T00:00:00`);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthName = d.toLocaleDateString(undefined, { month: "long" });

    if (period === "monthly") {
      return {
        rows: getAttendanceForMonth(year, month),
        name: `attendance-${year}-${String(month + 1).padStart(2, "0")}`,
        title: `Attendance Report — ${monthName} ${year}`,
      };
    }
    if (period === "yearly") {
      return {
        rows: getAttendanceForYear(year),
        name: `attendance-${year}`,
        title: `Attendance Report — ${year}`,
      };
    }
    return {
      rows: dayRecords,
      name: `attendance-${selected}`,
      title: `Attendance Report — ${selectedDateLabel}`,
    };
  };

  const handleExport = (kind) => {
    const { rows, name, title } = buildExport();
    if (rows.length === 0) {
      toast.error("No attendance records for the selected period.");
      return;
    }
    if (kind === "excel") {
      exportToExcel(name, EXPORT_COLUMNS, rows);
      toast.success(`Excel exported (${rows.length} records).`);
    } else {
      exportToPdf(title, EXPORT_COLUMNS, rows);
      toast.success("Opening printable PDF…");
    }
  };

  return (
    <>
      <PageHeader
        title="Attendance Record"
        subtitle="Pick a date to view attendance, and export by day, month, or year."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Calendar */}
        <Card className="h-fit">
          <CardHeader>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Select date
            </h2>
            <p className="text-sm text-muted-foreground">
              Tap any day to view its attendance.
            </p>
          </CardHeader>
          <CardContent>
            <Calendar selected={selected} onSelect={setSelected} />
          </CardContent>
        </Card>

        {/* Day view + export */}
        <div className="space-y-5">
          {/* Export bar */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Export:</span>
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

          {/* Selected day summary + table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold text-foreground">
                {selectedDateLabel}
              </h2>
              {dayRecords.length > 0 && (
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
              columns={[
                { key: "student", label: "Student" },
                { key: "section", label: "Section" },
                { key: "timeIn", label: "Time In" },
                { key: "status", label: "Status", badge: true },
              ]}
              rows={dayRecords}
              empty="No classes on this day (weekend) or no records found."
            />
          </div>
        </div>
      </div>
    </>
  );
}
