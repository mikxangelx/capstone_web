"use client";

import { PageHeader, DataTable } from "@/components/dashboard/dashboard-ui";
import { CASES } from "@/lib/mock-data";

export default function GuidanceCasesPage() {
  return (
    <>
      <PageHeader
        title="Cases"
        subtitle="Student cases referred to guidance and counseling."
      />

      <DataTable
        columns={[
          { key: "id", label: "Case ID" },
          { key: "student", label: "Student" },
          { key: "type", label: "Type" },
          { key: "priority", label: "Priority", badge: true },
          { key: "status", label: "Status", badge: true },
          { key: "updated", label: "Updated" },
        ]}
        rows={CASES}
      />
    </>
  );
}
