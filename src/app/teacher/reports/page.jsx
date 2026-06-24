"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, DataTable } from "@/components/dashboard/dashboard-ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ATTENDANCE_RECORDS } from "@/lib/mock-data";
import { exportToExcel, exportToPdf } from "@/lib/export";

// Columns shared by the on-screen table and both exports.
const COLUMNS = [
  { key: "date", label: "Date" },
  { key: "student", label: "Student" },
  { key: "section", label: "Section" },
  { key: "timeIn", label: "Time In" },
  { key: "status", label: "Status" },
];

export default function ReportsPage() {
  const handleExcel = () => {
    exportToExcel("attendance-report", COLUMNS, ATTENDANCE_RECORDS);
    toast.success("Excel file downloaded.");
  };

  const handlePdf = () => {
    exportToPdf("Attendance Report", COLUMNS, ATTENDANCE_RECORDS);
    toast.success("Opening printable PDF…");
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Export attendance records for record-keeping."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExcel}>
              <FileSpreadsheet className="size-4" />
              Export Excel
            </Button>
            <Button size="sm" onClick={handlePdf}>
              <FileText className="size-4" />
              Export PDF
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <h2 className="font-heading text-base font-semibold text-foreground">
            Attendance report preview
          </h2>
          <p className="text-sm text-muted-foreground">
            {ATTENDANCE_RECORDS.length} records · export to Excel (.xls) or PDF.
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[...COLUMNS.slice(0, 4), { key: "status", label: "Status", badge: true }]}
            rows={ATTENDANCE_RECORDS}
          />
        </CardContent>
      </Card>
    </>
  );
}
