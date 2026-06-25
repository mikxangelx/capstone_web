"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Forward,
  UserCheck,
  UserX,
  Clock,
  CalendarClock,
  CircleCheck,
  Inbox,
  Mail,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { StatusBadge, DataTable } from "@/components/dashboard/dashboard-ui";
import {
  getStudentStanding,
  prescriptiveFor,
  recommendedAction,
} from "@/lib/students";
import {
  getReferrals,
  getServerReferrals,
  subscribe,
  addReferral,
} from "@/lib/referrals";

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = ((Number(h) + 11) % 12) + 1;
  return `${hh}:${m} ${Number(h) < 12 ? "AM" : "PM"}`;
}

/**
 * Student-centric detail view shared by teacher and guidance.
 *  - mode "teacher":  AI recommendations + Forward to Guidance (with a note)
 *  - mode "guidance": why the student was forwarded (the teacher's note)
 * Both modes show the profile and attendance record.
 */
export function StudentDetail({ student, user, mode, backHref }) {
  const [confOpen, setConfOpen] = useState(false);

  const referrals = useSyncExternalStore(subscribe, getReferrals, getServerReferrals);
  const referral =
    referrals.find(
      (r) => r.studentId === student.id || r.student === student.name
    ) ?? null;

  const standing = getStudentStanding(student.name);
  const measures = prescriptiveFor(standing);
  const action = recommendedAction(standing);

  const initials = student.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const forward = (note) => {
    addReferral({
      studentId: student.id,
      student: student.name,
      section: student.section,
      guardian: "",
      reason: note,
      fromName: user?.name ?? "Teacher",
    });
    setConfOpen(false);
    toast.success("Student forwarded to guidance.");
  };

  const stats = [
    { icon: UserCheck, label: "Attendance", value: `${standing.rate}%`, tone: "bg-emerald-100 text-emerald-700" },
    { icon: UserX, label: "Absences", value: standing.absences, tone: "bg-red-100 text-red-700" },
    { icon: Clock, label: "Late arrivals", value: standing.lates, tone: "bg-amber-100 text-amber-700" },
  ];

  return (
    <>
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        {/* Designed student header (centered, holds all student info) */}
        <Card>
          <CardContent className="flex flex-wrap items-center gap-5">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-rose-700 text-xl font-bold text-primary-foreground shadow-sm">
              {initials}
            </span>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {student.name}
                </h1>
                {student.status && <StatusBadge value={student.status} />}
                {standing.needsAttention && (
                  <StatusBadge value="Needs attention" />
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-primary/70" />
                  {student.section || "No section"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-4 text-primary/70" />
                  {student.email}
                </span>
              </div>
            </div>

            {mode === "teacher" &&
              (referral ? (
                <ReferralStatus referral={referral} />
              ) : (
                <Button onClick={() => setConfOpen(true)}>
                  <Forward className="size-4" />
                  Forward to Guidance
                </Button>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* AI prescriptive recommendations — teacher only, on top */}
      {mode === "teacher" && (
        <Card className="bg-gradient-to-br from-primary/5 to-rose-50 ring-primary/15">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h2 className="font-heading text-base font-semibold text-foreground">
                  AI Prescriptive Recommendations
                </h2>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                AI preview
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Recommended interventions analyzed from this student&apos;s attendance pattern.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {measures.map((m, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl bg-white/70 p-3 text-sm text-foreground/90 ring-1 ring-black/5"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  {m}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              <Sparkles className="mr-1 inline size-3" />
              These recommendations will be generated by the AI model once connected. Shown as a preview.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Why forwarded — guidance only */}
          {mode === "guidance" && (
            <Card className="bg-gradient-to-br from-primary/5 to-rose-50 ring-primary/15">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Inbox className="size-4 text-primary" />
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    Why forwarded to guidance
                  </h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {referral?.reason ? (
                  <p className="text-sm text-foreground/90">“{referral.reason}”</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No note was provided by the teacher.
                  </p>
                )}
                {referral && (
                  <p className="text-xs text-muted-foreground">
                    Forwarded by {referral.fromName}
                    {referral.createdAt
                      ? ` · ${new Date(referral.createdAt).toLocaleDateString()}`
                      : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attendance record */}
          <Card>
            <CardHeader>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Attendance record
              </h2>
              <p className="text-sm text-muted-foreground">
                Last {standing.total} school days.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-black/5"
                  >
                    <span
                      className={`mx-auto mb-1.5 flex size-8 items-center justify-center rounded-lg ${s.tone}`}
                    >
                      <s.icon className="size-4" />
                    </span>
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <DataTable
                columns={[
                  { key: "date", label: "Date" },
                  { key: "timeIn", label: "Time In" },
                  { key: "status", label: "Status", badge: true },
                ]}
                rows={standing.history.slice(0, 12)}
                empty="No attendance records."
              />
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Recommended action */}
          <Card>
            <CardHeader>
              <h2 className="font-heading text-base font-semibold text-foreground">
                {mode === "teacher" ? "Recommended action" : "Standing"}
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-black/5">
                <p className="text-xs text-muted-foreground">Recommended action</p>
                <p className="font-medium text-foreground">{action}</p>
              </div>

              {mode === "teacher" && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Parent conference
                  </p>
                  {!referral ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setConfOpen(true)}
                      >
                        <Forward className="size-4" />
                        Forward to Guidance
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Add a note so guidance knows why you forwarded this student.
                      </p>
                    </>
                  ) : referral.status === "Scheduled" ? (
                    <div className="rounded-xl bg-emerald-50 p-3 text-sm ring-1 ring-emerald-200">
                      <p className="flex items-center gap-1.5 font-medium text-emerald-800">
                        <CalendarClock className="size-4" />
                        Scheduled by guidance
                      </p>
                      <p className="mt-0.5 text-emerald-700">
                        {referral.date} · {fmtTime(referral.time)}
                      </p>
                    </div>
                  ) : referral.status === "Declined" ? (
                    <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
                      Guidance declined this referral.
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Clock className="size-4" />
                        Awaiting guidance scheduling
                      </p>
                    </div>
                  )}
                </div>
              )}

              {mode === "guidance" && (
                <button
                  type="button"
                  onClick={() => toast.info("Email composer — to be connected.")}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Mail className="size-4" />
                  Email guardian
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forward-to-guidance modal */}
      {mode === "teacher" && (
        <Modal
          open={confOpen}
          onClose={() => setConfOpen(false)}
          title="Forward Student to Guidance"
        >
          <ForwardForm
            student={student.name}
            onSubmit={forward}
            onCancel={() => setConfOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}

function ReferralStatus({ referral }) {
  if (referral.status === "Scheduled") {
    return (
      <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm ring-1 ring-emerald-200">
        <p className="flex items-center gap-1.5 font-medium text-emerald-800">
          <CalendarClock className="size-4" />
          Conference: {referral.date} · {fmtTime(referral.time)}
        </p>
      </div>
    );
  }
  if (referral.status === "Declined") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200">
        Referral declined
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
      <CircleCheck className="size-4" />
      Forwarded — awaiting guidance
    </span>
  );
}

function ForwardForm({ student, onSubmit, onCancel }) {
  const [note, setNote] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(note);
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Forward <span className="font-medium text-foreground">{student}</span> to the
        guidance office. Add a note so guidance knows why. The AI will suggest
        appropriate conference times, and guidance picks the one that fits their schedule.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="fwd-note">Note to guidance</Label>
        <Textarea
          id="fwd-note"
          placeholder="e.g. Frequent tardiness this month — please follow up with the parents…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Forward className="size-4" />
          Forward to Guidance
        </Button>
      </div>
    </form>
  );
}
