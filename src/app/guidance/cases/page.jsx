"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { PageHeader, DataTable, StatusBadge } from "@/components/dashboard/dashboard-ui";
import { buttonVariants } from "@/components/ui/button";
import { CASES } from "@/lib/mock-data";
import { getUsers, getServerUsers, subscribe } from "@/lib/users";

export default function GuidanceCasesPage() {
  const users = useSyncExternalStore(subscribe, getUsers, getServerUsers);

  const rows = useMemo(
    () =>
      CASES.map((c) => {
        const match = users.find((u) => u.name === c.student);
        return { ...c, studentId: match?.id ?? null };
      }),
    [users]
  );

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
          {
            key: "open",
            label: "",
            render: (row) =>
              row.studentId ? (
                <Link
                  href={`/guidance/students/${row.studentId}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Eye className="size-4" />
                  View student
                </Link>
              ) : null,
          },
        ]}
        rows={rows}
      />
    </>
  );
}
