"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { PageHeader, DataTable, StatusBadge } from "@/components/dashboard/dashboard-ui";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { getUsers, getServerUsers, subscribe, isStudent } from "@/lib/users";
import { getStudentStanding } from "@/lib/students";

function useUsers() {
  return useSyncExternalStore(subscribe, getUsers, getServerUsers);
}

export default function LearnerStatusPage() {
  const users = useUsers();
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const [status, setStatus] = useState("all");

  const students = useMemo(() => users.filter(isStudent), [users]);

  const sections = useMemo(
    () => [...new Set(students.map((s) => s.section).filter(Boolean))].sort(),
    [students]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => {
        if (q && !s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q))
          return false;
        if (section !== "all" && s.section !== section) return false;
        if (status !== "all" && s.status !== status) return false;
        return true;
      })
      .map((s) => {
        const standing = getStudentStanding(s.name);
        return {
          ...s,
          rate: `${standing.rate}%`,
          standing: standing.needsAttention ? "Needs attention" : "Good standing",
        };
      });
  }, [students, query, section, status]);

  return (
    <>
      <PageHeader
        title="Learner Status"
        subtitle="Search a learner and open their record to review attendance and recommendations."
      />

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="h-11 pl-9"
          />
        </div>
        <Select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="h-11 w-auto min-w-44"
        >
          <option value="all">All sections</option>
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 w-auto min-w-36"
        >
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Disabled">Disabled</option>
        </Select>
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "section", label: "Section" },
          { key: "rate", label: "Attendance" },
          {
            key: "standing",
            label: "Standing",
            render: (row) => <StatusBadge value={row.standing} />,
          },
          {
            key: "open",
            label: "",
            render: (row) => (
              <Link
                href={`/teacher/learners/${row.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Eye className="size-4" />
                Open
              </Link>
            ),
          },
        ]}
        rows={rows}
        empty="No learners match your filters."
      />
    </>
  );
}
