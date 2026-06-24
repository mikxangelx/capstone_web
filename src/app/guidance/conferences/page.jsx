"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  CalendarClock,
  User,
  Users,
  Inbox,
  CalendarPlus,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, DataTable, StatusBadge } from "@/components/dashboard/dashboard-ui";
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
  declineReferral,
} from "@/lib/referrals";

function useReferrals() {
  return useSyncExternalStore(subscribe, getReferrals, getServerReferrals);
}

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = ((Number(h) + 11) % 12) + 1;
  return `${hh}:${m} ${Number(h) < 12 ? "AM" : "PM"}`;
}

function fmtDate(d) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function ConferencesPage() {
  const referrals = useReferrals();
  const [scheduling, setScheduling] = useState(null); // referral being scheduled
  const [selected, setSelected] = useState(null);

  const pending = useMemo(
    () => referrals.filter((r) => r.status === "Pending"),
    [referrals]
  );

  // Combine the static conferences with referrals guidance has scheduled.
  const conferences = useMemo(() => {
    const fromReferrals = referrals
      .filter((r) => r.status === "Scheduled")
      .map((r) => ({
        id: `REF-${r.studentId ?? r.caseId ?? r.id}`,
        date: r.date,
        time: fmtTime(r.time),
        student: r.student,
        parent: r.guardian || "—",
        status: "Scheduled",
      }));
    return [...fromReferrals, ...CONFERENCES];
  }, [referrals]);

  const conferenceDates = useMemo(
    () => [...new Set(conferences.map((c) => c.date))],
    [conferences]
  );

  // Default the calendar to the nearest upcoming conference.
  const effectiveSelected = useMemo(() => {
    if (selected) return selected;
    const today = toISODate(new Date());
    const sorted = [...conferenceDates].sort();
    return sorted.find((d) => d >= today) ?? sorted[sorted.length - 1] ?? today;
  }, [selected, conferenceDates]);

  const dayConferences = conferences.filter((c) => c.date === effectiveSelected);

  const selectedDateLabel = new Date(
    `${effectiveSelected}T00:00:00`
  ).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <PageHeader
        title="Scheduled Conference"
        subtitle="Schedule conferences forwarded by teachers and view the calendar."
      />

      {/* Pending referrals from teachers */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Inbox className="size-4 text-primary" />
            <h2 className="font-heading text-base font-semibold text-foreground">
              Referrals to schedule
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {pending.length}
            </span>
          </div>
          <ul className="space-y-3">
            {pending.map((r) => (
              <li key={r.id}>
                <Card>
                  <CardContent className="flex flex-wrap items-start justify-between gap-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {r.student}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {r.section}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        From {r.fromName}
                        {r.caseId ? ` · Case ${r.caseId}` : ""}
                      </p>
                      {r.reason && (
                        <p className="max-w-prose pt-1 text-sm text-foreground/90">
                          “{r.reason}”
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setScheduling(r)}>
                        <CalendarPlus className="size-4" />
                        Schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          declineReferral(r.id);
                          toast.success("Referral declined.");
                        }}
                      >
                        <X className="size-4" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Calendar */}
        <Card className="h-fit">
          <CardHeader>
            <h2 className="font-heading text-base font-semibold text-foreground">
              Conference calendar
            </h2>
            <p className="text-sm text-muted-foreground">
              Dots mark days with conferences.
            </p>
          </CardHeader>
          <CardContent>
            <Calendar
              selected={effectiveSelected}
              onSelect={setSelected}
              marked={conferenceDates}
            />
          </CardContent>
        </Card>

        {/* Selected day */}
        <div className="space-y-3">
          <h2 className="font-heading text-base font-semibold text-foreground">
            {selectedDateLabel}
          </h2>

          {dayConferences.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <CalendarClock className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No conferences scheduled for this date.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {dayConferences.map((c) => (
                <li key={c.id}>
                  <Card>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div className="flex items-center gap-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <CalendarClock className="size-5" />
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {c.time} · {c.id}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <User className="size-3.5" />
                              {c.student}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3.5" />
                              {c.parent}
                            </span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge value={c.status} />
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Full list */}
      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold text-foreground">
          All conferences
        </h2>
        <DataTable
          columns={[
            { key: "id", label: "Ref" },
            { key: "date", label: "Date" },
            { key: "time", label: "Time" },
            { key: "student", label: "Student" },
            { key: "parent", label: "Parent/Guardian" },
            { key: "status", label: "Status", badge: true },
          ]}
          rows={conferences}
        />
      </section>

      {/* Schedule modal */}
      <Modal
        open={!!scheduling}
        onClose={() => setScheduling(null)}
        title="Schedule Conference"
      >
        {scheduling && (
          <ScheduleForm
            referral={scheduling}
            onDone={(date) => {
              setScheduling(null);
              setSelected(date);
              toast.success("Conference scheduled.");
            }}
            onCancel={() => setScheduling(null)}
          />
        )}
      </Modal>
    </>
  );
}

function ScheduleForm({ referral, onDone, onCancel }) {
  const today = toISODate(new Date());

  // AI-prescribed slots stored on the referral (drop any now-past ones; fall
  // back to a fresh suggestion for older referrals that have none).
  const slots = useMemo(() => {
    const stored = (referral.suggestedSlots ?? []).filter((s) => s.date >= today);
    return stored.length ? stored : suggestConferenceSlots();
  }, [referral, today]);

  const [picked, setPicked] = useState(() =>
    slots[0] ? `${slots[0].date}T${slots[0].time}` : ""
  );
  const [custom, setCustom] = useState(false);
  const [date, setDate] = useState(slots[0]?.date ?? today);
  const [time, setTime] = useState(slots[0]?.time ?? "10:00");

  const submit = (e) => {
    e.preventDefault();
    let chosen;
    if (custom) {
      chosen = { date, time };
    } else {
      const [d, t] = picked.split("T");
      chosen = { date: d, time: t };
    }
    scheduleReferral(referral.id, chosen);
    onDone(chosen.date);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Set the conference schedule for{" "}
        <span className="font-medium text-foreground">{referral.student}</span>
        {referral.guardian ? ` (${referral.guardian})` : ""}.
      </p>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <p className="text-sm font-medium text-foreground">AI-suggested times</p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            AI preview
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Pick the slot that fits your availability.
        </p>
      </div>

      {!custom ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {slots.map((s) => {
            const value = `${s.date}T${s.time}`;
            const active = picked === value;
            return (
              <button
                type="button"
                key={value}
                onClick={() => setPicked(value)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-input hover:bg-slate-50"
                )}
              >
                <span className="text-sm font-medium text-foreground">
                  {fmtDate(s.date)}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {fmtTime(s.time)}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sch-date">Date</Label>
            <Input
              id="sch-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sch-time">Time</Label>
            <Input
              id="sch-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-11"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setCustom((v) => !v)}
        className="text-xs font-medium text-primary hover:underline"
      >
        {custom
          ? "← Back to AI-suggested times"
          : "None of these fit? Pick a custom time"}
      </button>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!custom && !picked}>
          <CalendarPlus className="size-4" />
          Confirm schedule
        </Button>
      </div>
    </form>
  );
}
