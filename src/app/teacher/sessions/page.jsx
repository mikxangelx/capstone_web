import { CalendarClock } from "lucide-react";
import { PageHeader, Placeholder } from "@/components/dashboard/dashboard-ui";

export default function AttendanceSessionsPage() {
  return (
    <>
      <PageHeader
        title="Attendance Sessions"
        subtitle="Browse past attendance-taking sessions per subject and date."
      />
      <Placeholder
        icon={CalendarClock}
        title="Attendance sessions coming soon"
        description="Each session you open will be listed here with its date, subject, and counts."
      />
    </>
  );
}
