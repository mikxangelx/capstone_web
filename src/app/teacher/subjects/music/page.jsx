import { Music } from "lucide-react";
import { PageHeader, Placeholder } from "@/components/dashboard/dashboard-ui";

export default function MusicSubjectPage() {
  return (
    <>
      <PageHeader
        title="Music (Gumamela)"
        subtitle="Take and review attendance for your Music homeroom subject."
      />
      <Placeholder
        icon={Music}
        title="Music attendance coming soon"
        description="This is where you'll mark attendance for the Gumamela Music class."
      />
    </>
  );
}
