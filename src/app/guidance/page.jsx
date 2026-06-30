"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Inbox,
  CalendarPlus,
  Clock,
  Sparkles,
  FolderOpen,
  CheckCircle2,
  X,
  User,
  Users,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { PageHeader, StatCard, StatusBadge } from "@/components/dashboard/dashboard-ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { toISODate, CONFERENCES, CASES } from "@/lib/mock-data";
import { suggestConferenceSlots } from "@/lib/students";
import {
  getReferrals,
  getServerReferrals,
  subscribe,
  scheduleReferral,
  declineReferral,
} from "@/lib/referrals";
import { getUsers, getServerUsers, subscribe as subUsers } from "@/lib/users";

function useReferrals() {
  return useSyncExternalStore(subscribe, getReferrals, getServerReferrals);
}

function useStudentLink(users) {
  return (name, studentId) => {
    const match =
      (studentId && users.find((u) => u.id === studentId)) ??
      users.find((u) => u.name === name);
    return match ? `/guidance/students/${match.id}` : null;
  };
}

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

export default function GuidanceDashboardPage() {
  const { user } = useAuth();
  const referrals = useReferrals();
  const users = useSyncExternalStore(subUsers, getUsers, getServerUsers);
  const studentLink = useStudentLink(users);
  const [scheduling, setScheduling] = useState(null);

  const today = toISODate(new Date());

  const pending = useMemo(
    () => referrals.filter((r) => r.status === "Pending"),
    [referrals]
  );

  const allConferences = useMemo(() => {
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

  const todayConferences = allConferences.filter((c) => c.date === today);
  const upcomingCount = allConferences.filter((c) => c.date >= today).length;
  const openCases = CASES.filter((c) => c.status !== "Resolved").length;
  const resolvedCases = CASES.filter((c) => c.status === "Resolved").length;

  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        subtitle="Your pending actions and today's schedule."
        actions={
          <Link href="/guidance/conferences" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <CalendarClock className="size-4" />
            All conferences
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Inbox} label="Pending referrals" value={pending.length} tone="warning" />
        <StatCard icon={CalendarClock} label="Upcoming conferences" value={upcomingCount} tone="info" />
        <StatCard icon={FolderOpen} label="Open cases" value={openCases} tone="primary" />
        <StatCard icon={CheckCircle2} label="Resolved" value={resolvedCases} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending referrals */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Inbox className="size-4 text-primary" />
            <h2 className="font-heading text-base font-semibold text-foreground">
              Referrals to act on
            </h2>
            {pending.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {pending.length}
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-1.5 py-10 text-center">
                <Inbox className="size-7 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No pending referrals.</p>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {pending.map((r) => (
                <li key={r.id}>
                  <Card>
                    <CardContent className="space-y-3 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold">
                            {studentLink(r.student, r.studentId) ? (
                              <Link
                                href={studentLink(r.student, r.studentId)}
                                className="text-primary hover:underline underline-offset-2"
                              >
                                {r.student}
                              </Link>
                            ) : (
                              <span className="text-foreground">{r.student}</span>
                            )}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {r.section}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            From {r.fromName}{r.caseId ? ` · Case ${r.caseId}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setScheduling(r)}>
                            <CalendarPlus className="size-4" />
                            Schedule
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { declineReferral(r.id); toast.success("Referral declined."); }}
                          >
                            <X className="size-4" />
                            Decline
                          </Button>
                        </div>
                      </div>
                      {r.reason && (
                        <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-foreground/90 ring-1 ring-black/5">
                          "{r.reason}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Today's conferences */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              <h2 className="font-heading text-base font-semibold text-foreground">
                Today's schedule
              </h2>
              {todayConferences.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {todayConferences.length}
                </span>
              )}
            </div>
            <Link
              href="/guidance/conferences"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-2"
            >
              View calendar
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {todayConferences.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-1.5 py-10 text-center">
                <CalendarClock className="size-7 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No conferences today.</p>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {todayConferences.map((c) => (
                <li key={c.id}>
                  <Card>
                    <CardContent className="flex flex-wrap items-center gap-4 py-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CalendarClock className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{c.time}</p>
                          {studentLink(c.student) && (
                            <Link
                              href={studentLink(c.student)}
                              className="text-sm font-semibold text-primary hover:underline underline-offset-2"
                            >
                              {c.student}
                            </Link>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3.5" />
                            {c.parent}
                          </span>
                        </div>
                      </div>
                      <StatusBadge value={c.status} />
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Schedule modal */}
      <Modal
        open={!!scheduling}
        onClose={() => setScheduling(null)}
        title="Schedule Conference"
      >
        {scheduling && (
          <ScheduleForm
            referral={scheduling}
            onDone={() => {
              setScheduling(null);
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
    const chosen = custom
      ? { date, time }
      : { date: picked.split("T")[0], time: picked.split("T")[1] };
    scheduleReferral(referral.id, chosen);
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Set the conference schedule for{" "}
        <span className="font-medium text-foreground">{referral.student}</span>
        {referral.guardian ? ` (${referral.guardian})` : ""}.
      </p>

      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-medium text-foreground">AI-suggested times</p>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">AI preview</span>
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
                  active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-input hover:bg-slate-50"
                )}
              >
                <span className="text-sm font-medium text-foreground">{fmtDate(s.date)}</span>
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
            <Input id="sch-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sch-time">Time</Label>
            <Input id="sch-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11" />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setCustom((v) => !v)}
        className="text-xs font-medium text-primary hover:underline"
      >
        {custom ? "← Back to AI-suggested times" : "None of these fit? Pick a custom time"}
      </button>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!custom && !picked}>
          <CalendarPlus className="size-4" />
          Confirm schedule
        </Button>
      </div>
    </form>
  );
}
