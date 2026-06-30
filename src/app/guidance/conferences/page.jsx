"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  CalendarClock,
  User,
  Users,
  Clock,
  Sparkles,
  CalendarPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatusBadge, DataTable } from "@/components/dashboard/dashboard-ui";
import { Calendar } from "@/components/dashboard/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { toISODate, CONFERENCES } from "@/lib/mock-data";
import { suggestConferenceSlots } from "@/lib/students";
import {
  getReferrals,
  getServerReferrals,
  subscribe,
  scheduleReferral,
} from "@/lib/referrals";
import { getUsers, getServerUsers, subscribe as subUsers } from "@/lib/users";
import {
  getConferenceOutcomes,
  getServerConferenceOutcomes,
  saveConferenceOutcome,
  subscribe as subscribeOutcomes,
} from "@/lib/conference-outcomes";

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = ((Number(h) + 11) % 12) + 1;
  return `${hh}:${m} ${Number(h) < 12 ? "AM" : "PM"}`;
}

function fmtDate(d) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });
}

function studentLink(users, name) {
  const match = users.find((u) => u.name === name);
  return match ? `/guidance/students/${match.id}` : null;
}

export default function GuidanceConferencesPage() {
  const referrals = useSyncExternalStore(subscribe, getReferrals, getServerReferrals);
  const outcomes = useSyncExternalStore(subscribeOutcomes, getConferenceOutcomes, getServerConferenceOutcomes);
  const users = useSyncExternalStore(subUsers, getUsers, getServerUsers);

  const [selected, setSelected] = useState(null);
  const [addingOutcome, setAddingOutcome] = useState(null);
  const [outcomeDraft, setOutcomeDraft] = useState("");
  const [rescheduling, setRescheduling] = useState(null);

  const today = toISODate(new Date());

  const allConferences = useMemo(() => {
    const fromReferrals = referrals
      .filter((r) => r.status === "Scheduled")
      .map((r) => ({
        id: `REF-${r.studentId ?? r.caseId ?? r.id}`,
        referralId: r.id,
        date: r.date,
        time: fmtTime(r.time),
        student: r.student,
        parent: r.guardian || "—",
        status: "Scheduled",
      }));
    return [...fromReferrals, ...CONFERENCES].sort((a, b) => a.date.localeCompare(b.date));
  }, [referrals]);

  const conferenceDates = useMemo(
    () => [...new Set(allConferences.map((c) => c.date))],
    [allConferences]
  );

  const effectiveSelected = useMemo(() => {
    if (selected) return selected;
    const sorted = [...conferenceDates].sort();
    return sorted.find((d) => d >= today) ?? sorted[sorted.length - 1] ?? today;
  }, [selected, conferenceDates, today]);

  const dayConferences = allConferences.filter((c) => c.date === effectiveSelected);

  const selectedDateLabel = new Date(`${effectiveSelected}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <>
      <PageHeader
        title="Conferences"
        subtitle="View the conference calendar, add outcome notes, and track all scheduled meetings."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Calendar */}
        <Card className="h-fit">
          <CardHeader>
            <h2 className="font-heading text-base font-semibold text-foreground">Calendar</h2>
            <p className="text-sm text-muted-foreground">Dots mark days with conferences.</p>
          </CardHeader>
          <CardContent>
            <Calendar
              selected={effectiveSelected}
              onSelect={setSelected}
              marked={conferenceDates}
            />
          </CardContent>
        </Card>

        {/* Day view */}
        <div className="space-y-4">
          <h2 className="font-heading text-base font-semibold text-foreground">
            {selectedDateLabel}
          </h2>

          {dayConferences.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <CalendarClock className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No conferences on this day.</p>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {dayConferences.map((c) => {
                const outcome = outcomes[c.id];
                const isAddingThis = addingOutcome === c.id;
                return (
                  <li key={c.id}>
                    <Card>
                      <CardContent className="space-y-3 py-4">
                        {/* Header row */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <CalendarClock className="size-5" />
                            </span>
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-foreground">{c.time}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-0 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <User className="size-3.5" />
                                  {studentLink(users, c.student) ? (
                                    <Link href={studentLink(users, c.student)} className="font-medium text-primary hover:underline underline-offset-2">
                                      {c.student}
                                    </Link>
                                  ) : c.student}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Users className="size-3.5" />{c.parent}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge value={c.status} />
                            <button
                              type="button"
                              onClick={() => {
                                setAddingOutcome(isAddingThis ? null : c.id);
                                setOutcomeDraft(outcome?.note ?? "");
                              }}
                              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                            >
                              {outcome ? "Edit outcome" : "+ Add outcome"}
                            </button>
                          </div>
                        </div>

                        {/* Saved outcome note */}
                        {outcome && !isAddingThis && (
                          <div className="rounded-xl bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-200">
                            <p className="mb-0.5 text-xs font-medium text-emerald-700">Outcome note</p>
                            <p className="text-sm text-foreground/90">{outcome.note}</p>
                          </div>
                        )}

                        {/* Outcome input */}
                        {isAddingThis && (
                          <div className="space-y-2">
                            <textarea
                              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                              rows={3}
                              placeholder="What was the outcome of this conference?"
                              value={outcomeDraft}
                              onChange={(e) => setOutcomeDraft(e.target.value)}
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setAddingOutcome(null)}>
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (!outcomeDraft.trim()) return;
                                  saveConferenceOutcome(c.id, { outcomeType: "held", note: outcomeDraft, caseAction: null });
                                  setAddingOutcome(null);
                                  toast.success("Outcome note saved.");
                                }}
                              >
                                Save note
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Full list */}
      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">All conferences</h2>
        <DataTable
          columns={[
            { key: "id", label: "Ref" },
            { key: "date", label: "Date" },
            { key: "time", label: "Time" },
            {
              key: "student",
              label: "Student",
              render: (row) => {
                const href = studentLink(users, row.student);
                return href ? (
                  <Link href={href} className="font-medium text-primary hover:underline underline-offset-2">
                    {row.student}
                  </Link>
                ) : <span>{row.student}</span>;
              },
            },
            { key: "parent", label: "Parent/Guardian" },
            { key: "status", label: "Status", badge: true },
            {
              key: "outcome",
              label: "Outcome",
              render: (row) => {
                const note = outcomes[row.id]?.note;
                return note ? (
                  <span className="line-clamp-1 max-w-xs text-xs text-emerald-700">{note}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAddingOutcome(row.id); setOutcomeDraft(""); setSelected(row.date); }}
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    + Add
                  </button>
                );
              },
            },
          ]}
          rows={allConferences}
        />
      </section>
    </>
  );
}
