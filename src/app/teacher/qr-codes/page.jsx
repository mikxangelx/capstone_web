import { QrCode } from "lucide-react";
import { PageHeader, Placeholder } from "@/components/dashboard/dashboard-ui";

export default function StudentQrCodesPage() {
  return (
    <>
      <PageHeader
        title="Student QR Codes"
        subtitle="Generate and print scannable QR codes for each student."
      />
      <Placeholder
        icon={QrCode}
        title="QR codes coming soon"
        description="Printable per-student QR codes for quick attendance scanning will appear here."
      />
    </>
  );
}
