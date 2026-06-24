"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Forward,
  Phone,
  Mail,
  CircleCheck,
  CalendarClock,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  getReferrals,
  getServerReferrals,
  subscribe,
  addReferral,
} from "@/lib/referrals";

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved"];

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = ((Number(h) + 11) % 12) + 1;
  return `${hh}:${m} ${Number(h) < 12 ? "AM" : "PM"}`;
}

export function CaseDetail({ caseData, user, backHref }) {
  const [status, setStatus] = useState(caseData.status);
  const [notes, setNotes] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [confOpen, setConfOpen] = useState(false);

  // Live referral status for this case (so the teacher sees when guidance schedules).
  const referrals = useSyncExternalStore(subscribe, getReferrals, getServerReferrals);
  const referral = referrals.find((r) => r.caseId === caseData.id) ?? null;

  const forwardCase = (reason) => {
    addReferral({
      caseId: caseData.id,
      student: caseData.student,
      section: caseData.section,
      guardian: caseData.guardian,
      reason,
      fromName: user?.name ?? "Teacher",
    });
    setConfOpen(false);
    toast.success("Case forwarded to guidance for conference scheduling.");
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    toast.success(`Status set to "${e.target.value}".`);
  };

  const addNote = () => {
    if (!noteDraft.trim()) return;
    setNotes((prev) => [
      {
        id: Date.now(),
        author: user?.name ?? "You",
        text: noteDraft.trim(),
        at: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    setNoteDraft("");
    toast.success("Note added.");
  };

  const stats = [
    { icon: UserCheck, label: "Attendance", value: `${caseData.attendanceRate}%`, tone: "bg-emerald-100 text-emerald-700" },
    { icon: UserX, label: "Absences", value: caseData.absences, tone: "bg-red-100 text-red-700" },
    { icon: Clock, label: "Late arrivals", value: caseData.lates, tone: "bg-amber-100 text-amber-700" },
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
          Back to Cases
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {caseData.student}
              </h1>
              <StatusBadge value={`${caseData.priority}`} />
              <StatusBadge value={status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {caseData.id} · {caseData.type} · {caseData.section}
            </p>
          </div>
          {referral ? (
            <ReferralStatus referral={referral} />
          ) : (
            <Button onClick={() => setConfOpen(true)}>
              <Forward className="size-4" />
              Forward to Guidance
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Why flagged */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-primary" />
                <h2 className="font-heading text-base font-semibold text-foreground">
                  Why this case was flagged
                </h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground/90">{caseData.reason}</p>
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
              <p className="text-xs text-muted-foreground">
                Based on {caseData.period.toLowerCase()}.
              </p>
            </CardContent>
          </Card>

          {/* Risk factors — why the priority */}
          <Card>
            <CardHeader>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Risk factors ({caseData.priority} priority)
              </h2>
              <p className="text-sm text-muted-foreground">
                Signals that determined this case&apos;s priority.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {caseData.riskFactors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* AI prescriptive measures — placeholder for the AI model */}
          <Card className="bg-gradient-to-br from-primary/5 to-rose-50 ring-primary/15">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    AI Prescriptive Measures
                  </h2>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  AI preview
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Recommended interventions analyzed from the student&apos;s attendance pattern.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2.5">
                {caseData.aiMeasures.map((m, i) => (
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
                These measures will be generated by the AI model once connected. Shown as a
                preview.
              </p>
            </CardContent>
          </Card>

          {/* Attendance history */}
          <Card>
            <CardHeader>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Recent attendance history
              </h2>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100">
                {caseData.history.map((h, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <StatusBadge value={h.status} />
                      <span className="text-sm text-foreground/90">{h.note}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{h.date}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Case notes */}
          <Card>
            <CardHeader>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Case notes
              </h2>
              <p className="text-sm text-muted-foreground">
                Log observations and actions taken.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Add a note…"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={addNote}>
                  Add note
                </Button>
              </div>
              {notes.length > 0 && (
                <ul className="space-y-2 pt-1">
                  {notes.map((n) => (
                    <li key={n.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-black/5">
                      <p className="text-sm text-foreground/90">{n.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.author} · {n.at}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Student / guardian */}
          <Card>
            <CardHeader>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Student
              </h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Name" value={caseData.student} />
              <Row label="Section" value={caseData.section} />
              <Row label="Guardian" value={caseData.guardian} />
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={`tel:${caseData.guardianContact.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Phone className="size-4" />
                  {caseData.guardianContact}
                </a>
                <button
                  type="button"
                  onClick={() => toast.info("Email composer — to be connected.")}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Mail className="size-4" />
                  Email guardian
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Manage case
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="case-status">Status</Label>
                <Select id="case-status" value={status} onChange={handleStatusChange}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-black/5">
                <p className="text-xs text-muted-foreground">Recommended action</p>
                <p className="font-medium text-foreground">{caseData.recommendedAction}</p>
              </div>

              {/* Parent conference: teacher forwards, guidance schedules */}
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
                      Guidance will coordinate and set the schedule.
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forward-to-guidance modal */}
      <Modal
        open={confOpen}
        onClose={() => setConfOpen(false)}
        title="Forward Case to Guidance"
      >
        <ForwardForm
          student={caseData.student}
          onSubmit={forwardCase}
          onCancel={() => setConfOpen(false)}
        />
      </Modal>
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
  const [reason, setReason] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(reason);
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Forward{" "}
        <span className="font-medium text-foreground">{student}</span>&apos;s case to
        the guidance office. Guidance will coordinate availability and set the
        conference schedule.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="fwd-reason">Note to guidance (optional)</Label>
        <Textarea
          id="fwd-reason"
          placeholder="Reason / context for the conference…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
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

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

