"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/dashboard/dashboard-ui";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getUsers, getServerUsers, subscribe, isStudent } from "@/lib/users";
import { getStudentStanding } from "@/lib/students";
import { CASES } from "@/lib/mock-data";

function useUsers() {
  return useSyncExternalStore(subscribe, getUsers, getServerUsers);
}

// Map student name → their most urgent active case status.
function activeCaseFor(name) {
  const active = CASES.filter(
    (c) => c.student === name && c.status !== "Resolved"
  );
  if (active.length === 0) return null;
  // Return highest-priority one.
  const order = { High: 0, Medium: 1, Low: 2 };
  return active.sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9))[0];
}

export default function GuidanceStudentsPage() {
  const users = useUsers();
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const [filter, setFilter] = useState("all"); // all | attention | case

  const students = useMemo(() => users.filter(isStudent), [users]);

  const sections = useMemo(
    () => [...new Set(students.map((s) => s.section).filter(Boolean))].sort(),
    [students]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => {
        if (q && !s.name.toLowerCase().includes(q)) return false;
        if (section !== "all" && s.section !== section) return false;
        return true;
      })
      .map((s) => {
        const standing = getStudentStanding(s.name);
        const activeCase = activeCaseFor(s.name);
        return { ...s, standing, activeCase };
      })
      .filter((s) => {
        if (filter === "attention") return s.standing.needsAttention;
        if (filter === "case") return !!s.activeCase;
        return true;
      })
      .sort((a, b) => {
        // Sort: has active case first, then needs attention, then alphabetical.
        const aScore = a.activeCase ? 0 : a.standing.needsAttention ? 1 : 2;
        const bScore = b.activeCase ? 0 : b.standing.needsAttention ? 1 : 2;
        if (aScore !== bScore) return aScore - bScore;
        return a.name.localeCompare(b.name);
      });
  }, [students, query, section, filter]);

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="All students — open a profile to view attendance history, cases, and referral notes."
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
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
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-11 w-auto min-w-44"
        >
          <option value="all">All students</option>
          <option value="attention">Needs attention</option>
          <option value="case">Has active case</option>
        </Select>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm ring-1 ring-black/5">
          No students match your filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
          {rows.map((row, i) => (
            <Link
              key={row.id}
              href={`/guidance/students/${row.id}`}
              className={`flex flex-wrap items-center gap-3 px-4 py-3.5 text-sm hover:bg-slate-50 ${
                i < rows.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              {/* Status dot */}
              <span
                className={`size-2 shrink-0 rounded-full ${
                  row.activeCase
                    ? row.activeCase.priority === "High"
                      ? "bg-red-500"
                      : "bg-amber-400"
                    : row.standing.needsAttention
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
              />

              {/* Name + section */}
              <span className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{row.name}</span>
                <span className="mx-1.5 text-muted-foreground">·</span>
                <span className="text-muted-foreground">{row.section || "—"}</span>
              </span>

              {/* Attendance rate */}
              <span className="shrink-0 text-xs text-muted-foreground">
                {row.standing.rate}% attendance
              </span>

              {/* Active case badge */}
              {row.activeCase && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Case: {row.activeCase.type}
                </span>
              )}

              {/* Standing badge */}
              <StatusBadge
                value={
                  row.standing.needsAttention ? "Needs attention" : "Good standing"
                }
              />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
