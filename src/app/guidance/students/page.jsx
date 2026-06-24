"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Eye, Inbox } from "lucide-react";
import { PageHeader, DataTable } from "@/components/dashboard/dashboard-ui";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getReferrals,
  getServerReferrals,
  subscribe as subReferrals,
} from "@/lib/referrals";
import {
  getUsers,
  getServerUsers,
  subscribe as subUsers,
} from "@/lib/users";

function useReferrals() {
  return useSyncExternalStore(subReferrals, getReferrals, getServerReferrals);
}
function useUsers() {
  return useSyncExternalStore(subUsers, getUsers, getServerUsers);
}

export default function GuidanceStudentsPage() {
  const referrals = useReferrals();
  const users = useUsers();

  // One row per forwarded student (most recent referral wins — newest first).
  const rows = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const r of referrals) {
      const key = r.studentId ?? r.student;
      if (seen.has(key)) continue;
      seen.add(key);
      const matched =
        users.find((u) => u.id === r.studentId) ??
        users.find((u) => u.name === r.student);
      out.push({
        id: matched?.id ?? r.studentId ?? null,
        student: r.student,
        section: r.section || matched?.section || "—",
        fromName: r.fromName,
        reason: r.reason,
        status: r.status,
      });
    }
    return out;
  }, [referrals, users]);

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Students forwarded to guidance. Open a student to see why they were forwarded and their attendance record."
      />

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Inbox className="size-9 text-muted-foreground/40" />
            <p className="font-medium text-foreground">No students forwarded yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              When a teacher forwards a student, they&apos;ll appear here with the
              teacher&apos;s note.
            </p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={[
            { key: "student", label: "Student" },
            { key: "section", label: "Section" },
            { key: "fromName", label: "Forwarded by" },
            {
              key: "reason",
              label: "Note",
              render: (row) => (
                <span className="line-clamp-1 max-w-xs text-foreground/90">
                  {row.reason || "—"}
                </span>
              ),
            },
            { key: "status", label: "Status", badge: true },
            {
              key: "open",
              label: "",
              render: (row) =>
                row.id ? (
                  <Link
                    href={`/guidance/students/${row.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Eye className="size-4" />
                    Open
                  </Link>
                ) : null,
            },
          ]}
          rows={rows}
        />
      )}
    </>
  );
}
