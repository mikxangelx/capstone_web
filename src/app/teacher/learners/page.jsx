"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/dashboard/dashboard-ui";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm ring-1 ring-black/5">
          No learners match your filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
          {rows.map((row, i) => (
            <Link
              key={row.id ?? i}
              href={`/teacher/learners/${row.id}`}
              className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 ${
                i < rows.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <span
                className={`size-2 shrink-0 rounded-full ${
                  row.standing === "Needs attention" ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{row.name}</span>
                <span className="mx-1.5 text-muted-foreground">·</span>
                <span className="text-muted-foreground">{row.section}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{row.rate}</span>
              <StatusBadge value={row.standing} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
