"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { PageHeader, DataTable } from "@/components/dashboard/dashboard-ui";
import { buttonVariants } from "@/components/ui/button";
import { CASES } from "@/lib/mock-data";

export default function TeacherCasesPage() {
  return (
    <>
      <PageHeader
        title="Cases"
        subtitle="Open a student's case to see why they were flagged and the recommended measures."
      />

      <DataTable
        columns={[
          { key: "id", label: "Case ID" },
          { key: "student", label: "Student" },
          { key: "type", label: "Type" },
          { key: "priority", label: "Priority", badge: true },
          { key: "status", label: "Status", badge: true },
          {
            key: "open",
            label: "",
            render: (row) => (
              <Link
                href={`/teacher/cases/${row.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Eye className="size-4" />
                Open
              </Link>
            ),
          },
        ]}
        rows={CASES}
      />
    </>
  );
}
