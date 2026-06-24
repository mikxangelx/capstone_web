import { BookOpen } from "lucide-react";
import { PageHeader, Placeholder } from "@/components/dashboard/dashboard-ui";

export default function EnglishSubjectPage() {
  return (
    <>
      <PageHeader
        title="English (Gumamela)"
        subtitle="Take and review attendance for your English homeroom subject."
      />
      <Placeholder
        icon={BookOpen}
        title="English attendance coming soon"
        description="This is where you'll mark attendance for the Gumamela English class."
      />
    </>
  );
}
