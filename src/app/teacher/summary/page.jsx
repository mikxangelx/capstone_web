import { ChartColumn } from "lucide-react";
import { PageHeader, Placeholder } from "@/components/dashboard/dashboard-ui";

export default function SummaryAttendancePage() {
  return (
    <>
      <PageHeader
        title="Summary Attendance"
        subtitle="Roll-up of attendance totals across subjects and periods."
      />
      <Placeholder
        icon={ChartColumn}
        title="Summary attendance coming soon"
        description="Aggregated present/late/absent/excused totals and trends will appear here."
      />
    </>
  );
}
