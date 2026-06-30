"use client";

import { useState, useSyncExternalStore } from "react";
import { FileSpreadsheet, FileText, ChevronLeft, ChevronRight, ClipboardList, X } from "lucide-react";
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
  STUDENT_ROSTER,
} from "@/lib/mock-data";
import { exportToExcel, exportToPdf } from "@/lib/export";
import {
  getOverrides,
  getServerOverrides,
  applyOverrides,
  setBulkOverrides,
  subscribe as subscribeOverrides,
} from "@/lib/attendance-overrides";

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

const STATUS_OPTIONS = ["Present", "Late", "Absent", "Excused"];
const STATUS_TONE = {
  Present: "border-emerald-300 bg-emerald-50 text-emerald-700 ring-emerald-300",
  Late:    "border-amber-300 bg-amber-50 text-amber-700 ring-amber-300",
  Absent:  "border-red-300 bg-red-50 text-red-700 ring-red-300",
  Excused: "border-sky-300 bg-sky-50 text-sky-700 ring-sky-300",
};

export default function AttendanceRecordPage() {
  const [selected, setSelected] = useState(() => toISODate(new Date()));
  const [period, setPeriod] = useState("daily");
  const [activeFilter, setActiveFilter] = useState(null);
  const [taking, setTaking] = useState(false);
  // Local draft for the bulk take-attendance panel: { [name]: status }
  const [draft, setDraft] = useState({});

  const overrides = useSyncExternalStore(subscribeOverrides, getOverrides, getServerOverrides);

  const isMonthly = period === "monthly";

  const d = new Date(`${selected}T00:00:00`);
  const year = d.getFullYear();
  const monthIndex = d.getMonth();

  const rawRecords = isMonthly
    ? getAttendanceForMonth(year, monthIndex)
    : getAttendanceForDate(selected);
  const allRecords = applyOverrides(overrides, rawRecords);
  const summary = summarize(allRecords);
  const records = activeFilter
    ? allRecords.filter((r) => r.status?.toLowerCase() === activeFilter)
    : allRecords;

  const handleChipClick = (key) =>
    setActiveFilter((prev) => (prev === key ? null : key));

  const dayLabel = d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const monthLabel = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const recordsLabel = isMonthly ? monthLabel : dayLabel;

  const goToMonth = (m, y = year) => {
    setActiveFilter(null);
    setSelected(toISODate(new Date(y, m, 1)));
  };

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

  // Open bulk panel — seed draft from current records so existing marks show.
  const openTakeAttendance = () => {
    const seed = {};
    for (const s of STUDENT_ROSTER) {
      const existing = overrides[`${s.name}::${selected}`];
      if (existing) { seed[s.name] = existing; continue; }
      const row = rawRecords.find((r) => r.student === s.name);
      seed[s.name] = row?.status ?? "Present";
    }
    setDraft(seed);
    setTaking(true);
  };

  const saveBulk = () => {
    const entries = STUDENT_ROSTER.map((s) => ({
      name: s.name,
      dateStr: selected,
      status: draft[s.name] ?? "Present",
    }));
    setBulkOverrides(entries);
    setTaking(false);
    toast.success(`Attendance saved for ${dayLabel}.`);
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
        {/* Picker */}
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
              <Calendar selected={selected} onSelect={(v) => { setSelected(v); setTaking(false); }} />
            )}
          </CardContent>
        </Card>

        {/* Records + export */}
        <div className="space-y-5">
          {/* Control bar */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">View:</span>
                <div className="inline-flex rounded-full bg-slate-100 p-1">
                  {PERIODS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => { setPeriod(p.key); setActiveFilter(null); setTaking(false); }}
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
                {!isMonthly && (
                  <Button
                    variant={taking ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => taking ? setTaking(false) : openTakeAttendance()}
                  >
                    {taking ? <X className="size-4" /> : <ClipboardList className="size-4" />}
                    {taking ? "Cancel" : "Take Attendance"}
                  </Button>
                )}
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

          {/* Bulk take-attendance panel */}
          {taking && !isMonthly && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-base font-semibold text-foreground">
                      Take Attendance
                    </h2>
                    <p className="text-sm text-muted-foreground">{dayLabel}</p>
                  </div>
                  <Button size="sm" onClick={saveBulk}>
                    Save
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-slate-100">
                  {STUDENT_ROSTER.map((s) => (
                    <li key={s.name} className="flex flex-wrap items-center gap-3 py-3">
                      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                        {s.name}
                      </span>
                      <div className="flex gap-1.5">
                        {STATUS_OPTIONS.map((st) => {
                          const active = draft[s.name] === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setDraft((prev) => ({ ...prev, [s.name]: st }))}
                              className={cn(
                                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                                active
                                  ? `${STATUS_TONE[st]} ring-2`
                                  : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                              )}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Summary + table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold text-foreground">
                {recordsLabel}
              </h2>
              {allRecords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {SUMMARY_CHIPS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => handleChipClick(c.key)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
                        c.className,
                        activeFilter === c.key
                          ? "ring-2 ring-offset-1 ring-current opacity-100"
                          : activeFilter
                          ? "opacity-50 hover:opacity-80"
                          : "hover:opacity-80"
                      )}
                    >
                      {c.label}: {summary[c.key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <DataTable
              columns={tableColumns}
              rows={records}
              empty={
                activeFilter
                  ? `No ${activeFilter} records for this period.`
                  : isMonthly
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
