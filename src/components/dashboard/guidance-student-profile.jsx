"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft, GraduationCap, Mail, Phone,
  UserCheck, UserX, Clock, CalendarClock, Inbox,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronRight,
  Users, XCircle, CalendarX, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge, DataTable } from "@/components/dashboard/dashboard-ui";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CASES, CONFERENCES,
  getAttendanceForStudentInMonth as getMonthAttendance,
  summarize, toISODate,
} from "@/lib/mock-data";
import { getStudentStanding } from "@/lib/students";
import { getReferrals, getServerReferrals, subscribe as subReferrals } from "@/lib/referrals";
import {
  getConferenceOutcomes, getServerConferenceOutcomes,
  saveConferenceOutcome, subscribe as subOutcomes,
} from "@/lib/conference-outcomes";
import {
  getCaseResolutions, getServerCaseResolutions,
  resolveCase, subscribe as subResolutions,
} from "@/lib/case-resolutions";
import { getOverrides, getServerOverrides, applyOverrides, subscribe as subOverrides } from "@/lib/attendance-overrides";

const PRIORITY_COLOR = {
  High:   "text-red-600 bg-red-50 ring-red-200",
  Medium: "text-amber-600 bg-amber-50 ring-amber-200",
  Low:    "text-slate-600 bg-slate-50 ring-slate-200",
};

const OUTCOME_OPTIONS = [
  { value: "held",        label: "Conference was held",       icon: CheckCircle2,  color: "text-emerald-600 bg-emerald-50 ring-emerald-200" },
  { value: "noshow",      label: "Parent did not show up",    icon: CalendarX,     color: "text-red-600 bg-red-50 ring-red-200" },
  { value: "rescheduled", label: "Needs to be rescheduled",   icon: RefreshCw,     color: "text-amber-600 bg-amber-50 ring-amber-200" },
];

const CASE_ACTION_OPTIONS = [
  { value: "close",     label: "Close the case — concern resolved" },
  { value: "monitor",   label: "Continue monitoring" },
  { value: "followup",  label: "Schedule a follow-up conference" },
];

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = ((Number(h) + 11) % 12) + 1;
  return `${hh}:${m} ${Number(h) < 12 ? "AM" : "PM"}`;
}

function toMinutes(t) {
  if (!t) return 0;
  const ampm = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampm) {
    let h = Number(ampm[1]);
    const m = Number(ampm[2]);
    const period = ampm[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function isConferencePast(date, timeStr, today) {
  if (date < today) return true;
  if (date > today) return false;
  const now = new Date();
  return toMinutes(timeStr) + 60 <= now.getHours() * 60 + now.getMinutes();
}

// ── Mark-done modal ───────────────────────────────────────────────────────────
function MarkDoneModal({ conference, activeCases, open, onClose, onSave }) {
  const [outcomeType, setOutcomeType] = useState("held");
  const [note, setNote]               = useState("");
  const [caseAction, setCaseAction]   = useState("monitor");

  function handleSave() {
    onSave({ outcomeType, note, caseAction: activeCases.length > 0 ? caseAction : null });
    setOutcomeType("held");
    setNote("");
    setCaseAction("monitor");
  }

  if (!conference) return null;

  return (
    <Modal open={open} onClose={onClose} title="Conference outcome">
      <div className="space-y-5">
        {/* Conference info */}
        <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-black/5">
          <p className="text-sm font-medium text-foreground">{conference.date} · {conference.time}</p>
          <p className="text-xs text-muted-foreground mt-0.5">With {conference.parent}</p>
        </div>

        {/* Outcome type */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">What happened?</p>
          <div className="space-y-2">
            {OUTCOME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOutcomeType(opt.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium ring-1 transition-all",
                  outcomeType === opt.value
                    ? opt.color + " ring-current/30"
                    : "bg-white text-foreground ring-black/10 hover:bg-slate-50"
                )}
              >
                <opt.icon className="size-4 shrink-0" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">
            Notes <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            rows={3}
            placeholder="What was discussed? Any agreements or commitments made?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Case action — only if active case exists */}
        {activeCases.length > 0 && outcomeType === "held" && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">What's next for the case?</p>
            <div className="space-y-1.5">
              {CASE_ACTION_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-black/5 hover:bg-slate-100">
                  <input
                    type="radio"
                    name="caseAction"
                    value={opt.value}
                    checked={caseAction === opt.value}
                    onChange={() => setCaseAction(opt.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
          >
            <CheckCircle2 className="size-4" />
            Save outcome
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function GuidanceStudentProfile({ student, backHref = "/guidance/students" }) {
  const referrals   = useSyncExternalStore(subReferrals, getReferrals, getServerReferrals);
  const outcomes    = useSyncExternalStore(subOutcomes, getConferenceOutcomes, getServerConferenceOutcomes);
  const resolutions = useSyncExternalStore(subResolutions, getCaseResolutions, getServerCaseResolutions);
  const overrides   = useSyncExternalStore(subOverrides, getOverrides, getServerOverrides);

  const [period, setPeriod]           = useState("recent");
  const [markingConf, setMarkingConf] = useState(null);  // conference object for modal
  const [closingCase, setClosingCase] = useState(null);  // case ID
  const [closeDraft, setCloseDraft]   = useState("");
  const [expanded, setExpanded]       = useState(new Set());

  function toggleExpand(key) {
    setExpanded((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  const standing = getStudentStanding(student.name);
  const today    = toISODate(new Date());

  const allStudentCases = CASES.filter((c) => c.student === student.name);
  const activeCases     = allStudentCases.filter((c) => c.status !== "Resolved" && !resolutions[c.id]);
  const resolvedCases   = allStudentCases.filter((c) => c.status === "Resolved" || !!resolutions[c.id]);

  const referral = referrals
    .filter((r) => r.studentId === student.id || r.student === student.name)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0] ?? null;

  const allConferences = useMemo(() => {
    const fromRef = referrals
      .filter((r) => (r.studentId === student.id || r.student === student.name) && r.status === "Scheduled")
      .map((r) => ({ id: `REF-${r.studentId ?? r.caseId ?? r.id}`, date: r.date, time: fmtTime(r.time), parent: r.guardian || "—", status: "Scheduled" }));
    const fromStatic = CONFERENCES.filter((c) => c.student === student.name);
    return [...fromRef, ...fromStatic].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [referrals, student]);

  const upcomingConfs = allConferences.filter((c) => !isConferencePast(c.date, c.time, today));
  const pastConfs     = allConferences.filter((c) =>  isConferencePast(c.date, c.time, today));

  // ── Attendance ────────────────────────────────────────────────────────────
  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { value: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("default", { month: "long", year: "numeric" }), year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);

  const periodRecord = useMemo(() => {
    if (period === "recent") return { history: standing.history, counts: standing.counts, rate: standing.rate, label: `Last ${standing.total} school days` };
    const [y, m] = period.split("-").map(Number);
    const history = getMonthAttendance(student.name, y, m);
    const counts  = summarize(history);
    return { history, counts, rate: Math.round((counts.present / (history.length || 1)) * 100), label: monthOptions.find((o) => o.value === period)?.label ?? "" };
  }, [period, student.name, standing, monthOptions]);

  const displayHistory = applyOverrides(overrides, periodRecord.history);

  // ── Timeline ──────────────────────────────────────────────────────────────
  const timelineItems = useMemo(() => [
    ...allStudentCases.map((c) => {
      const res = resolutions[c.id];
      const done = c.status === "Resolved" || !!res;
      return {
        key: `case-${c.id}`,
        date: c.updated,
        label: c.type,
        sub: `Case ${c.id} · ${done ? "Resolved" : c.status}`,
        dot: done ? "bg-emerald-400" : c.priority === "High" ? "bg-red-500" : "bg-amber-400",
        color: done ? "text-emerald-600" : c.priority === "High" ? "text-red-600" : "text-amber-600",
        details: { type: "case", reason: c.reason, riskFactors: c.riskFactors ?? [], resolutionNote: res?.note ?? null, resolvedAt: res?.resolvedAt ? new Date(res.resolvedAt).toLocaleDateString() : null },
      };
    }),
    ...allConferences.map((c) => {
      const o = outcomes[c.id];
      const done = c.status === "Completed" || o?.completed;
      const outcomeLabel = o?.outcomeType === "noshow" ? "Parent no-show" : o?.outcomeType === "rescheduled" ? "Rescheduled" : done ? "Completed" : c.status;
      return {
        key: `conf-${c.id}`,
        date: c.date,
        label: `Conference · ${c.time}`,
        sub: outcomeLabel,
        dot: done ? "bg-emerald-400" : "bg-sky-400",
        color: done ? "text-emerald-600" : "text-sky-600",
        details: { type: "conference", parent: c.parent, outcomeNote: o?.note ?? null, outcomeType: o?.outcomeType ?? null },
      };
    }),
  ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")), [allStudentCases, allConferences, resolutions, outcomes]);

  const initials = student.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSaveOutcome({ outcomeType, note, caseAction }) {
    saveConferenceOutcome(markingConf.id, { outcomeType, note, caseAction });
    if (caseAction === "close" && activeCases.length > 0) {
      resolveCase(activeCases[0].id, note || `Resolved after conference on ${markingConf.date}.`);
      toast.success("Conference saved & case closed.");
    } else {
      toast.success("Conference outcome saved.");
    }
    setMarkingConf(null);
  }

  function handleCloseCase(caseId) {
    resolveCase(caseId, closeDraft.trim());
    setClosingCase(null);
    setCloseDraft("");
    toast.success("Case closed.");
  }

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" />Back to Students
      </Link>

      {/* ── Mark-done modal ─────────────────────────────────────────────── */}
      <MarkDoneModal
        conference={markingConf}
        activeCases={activeCases}
        open={!!markingConf}
        onClose={() => setMarkingConf(null)}
        onSave={handleSaveOutcome}
      />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-5">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-rose-700 text-xl font-bold text-primary-foreground shadow-sm">
            {initials}
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold text-foreground">{student.name}</h1>
              {standing.needsAttention && <StatusBadge value="Needs attention" />}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-4 text-primary/70" />{student.section || "No section"}</span>
              <span className="inline-flex items-center gap-1.5"><Mail className="size-4 text-primary/70" />{student.email}</span>
            </div>
          </div>
          <div className="flex gap-3">
            {[
              { label: "Rate",     value: `${standing.rate}%`, color: standing.rate >= 75 ? "text-emerald-600" : "text-red-600" },
              { label: "Absences", value: standing.absences,   color: standing.absences >= 6 ? "text-red-600" : "text-foreground" },
              { label: "Lates",    value: standing.lates,      color: standing.lates >= 5 ? "text-amber-600" : "text-foreground" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-50 px-3 py-2 text-center ring-1 ring-black/5">
                <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main ─────────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Referral note */}
          {referral && (
            <Card className="bg-gradient-to-br from-primary/5 to-rose-50 ring-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Inbox className="size-4 text-primary" />
                  <h2 className="font-heading text-base font-semibold text-foreground">Teacher's referral note</h2>
                  <StatusBadge value={referral.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Forwarded by {referral.fromName}{referral.createdAt ? ` · ${new Date(referral.createdAt).toLocaleDateString()}` : ""}
                </p>
              </CardHeader>
              <CardContent>
                {referral.reason
                  ? <p className="text-sm leading-relaxed text-foreground/90">"{referral.reason}"</p>
                  : <p className="text-sm italic text-muted-foreground">No note was added.</p>}
              </CardContent>
            </Card>
          )}

          {/* Active cases */}
          {activeCases.map((c) => (
            <Card key={c.id} className="ring-amber-200">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <h2 className="font-heading text-base font-semibold text-foreground">{c.type}</h2>
                  </div>
                  <div className="flex gap-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", PRIORITY_COLOR[c.priority] ?? PRIORITY_COLOR.Low)}>
                      {c.priority} priority
                    </span>
                    <StatusBadge value={c.status} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Case {c.id} · Updated {c.updated}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-foreground/90">{c.reason}</p>
                {c.riskFactors?.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Risk factors</p>
                    <ul className="space-y-1">
                      {c.riskFactors.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {closingCase === c.id ? (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-medium text-foreground">Resolution note <span className="font-normal text-muted-foreground">(optional)</span></p>
                    <textarea
                      className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      rows={3}
                      placeholder="What was the outcome? What action was taken?"
                      value={closeDraft}
                      onChange={(e) => setCloseDraft(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setClosingCase(null)}>Cancel</Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleCloseCase(c.id)}>
                        <CheckCircle2 className="size-4" />Confirm close
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end border-t border-slate-100 pt-3">
                    <Button size="sm" variant="outline" onClick={() => { setClosingCase(c.id); setCloseDraft(""); }}>
                      <XCircle className="size-4" />Close this case
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Upcoming conferences */}
          {upcomingConfs.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-primary" />
                  <h2 className="font-heading text-base font-semibold text-foreground">Upcoming conference{upcomingConfs.length > 1 ? "s" : ""}</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingConfs.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CalendarClock className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">{c.date} · {c.time}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5" />{c.parent}</p>
                    </div>
                    <StatusBadge value={c.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Attendance record */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-base font-semibold text-foreground">Attendance record</h2>
                  <p className="text-sm text-muted-foreground">{periodRecord.label}</p>
                </div>
                <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-9 w-auto min-w-40 text-sm">
                  <option value="recent">Last 30 days</option>
                  {monthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: UserCheck, label: "Attendance",    value: `${periodRecord.rate}%`,    tone: "bg-emerald-100 text-emerald-700" },
                  { icon: UserX,     label: "Absences",      value: periodRecord.counts.absent, tone: "bg-red-100 text-red-700" },
                  { icon: Clock,     label: "Late arrivals", value: periodRecord.counts.late,   tone: "bg-amber-100 text-amber-700" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-black/5">
                    <span className={cn("mx-auto mb-1.5 flex size-8 items-center justify-center rounded-lg", s.tone)}>
                      <s.icon className="size-4" />
                    </span>
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <DataTable
                columns={[{ key: "date", label: "Date" }, { key: "timeIn", label: "Time In" }, { key: "status", label: "Status", badge: true }]}
                rows={displayHistory}
                empty="No attendance records."
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Guardian */}
          {activeCases[0]?.guardianContact && (
            <Card>
              <CardHeader><h2 className="font-heading text-base font-semibold text-foreground">Guardian</h2></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium text-foreground">{activeCases[0].guardian}</p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="size-4 text-primary/70" />{activeCases[0].guardianContact}
                </p>
                <button type="button" onClick={() => toast.info("Email composer — to be connected.")}
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-2 hover:underline">
                  <Mail className="size-3.5" />Email guardian
                </button>
              </CardContent>
            </Card>
          )}

          {/* Past conferences */}
          {pastConfs.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-heading text-base font-semibold text-foreground">Past conferences</h2>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-slate-100">
                  {pastConfs.map((c) => {
                    const o = outcomes[c.id];
                    const done = c.status === "Completed" || o?.completed;
                    const outcomeOpt = OUTCOME_OPTIONS.find((x) => x.value === o?.outcomeType);
                    return (
                      <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{c.date} · {c.time}</p>
                            <p className="text-xs text-muted-foreground">{c.parent}</p>
                          </div>
                          {done ? (
                            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1", outcomeOpt?.color ?? "text-emerald-700 bg-emerald-50 ring-emerald-200")}>
                              {outcomeOpt?.label ?? "Completed"}
                            </span>
                          ) : (
                            <Button size="sm" variant="outline" className="h-7 shrink-0 px-2.5 text-xs" onClick={() => setMarkingConf(c)}>
                              Mark done
                            </Button>
                          )}
                        </div>
                        {/* Outcome note */}
                        {o?.note && (
                          <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-foreground/80 ring-1 ring-black/5">
                            {o.note}
                          </p>
                        )}
                        {/* Edit button for done */}
                        {done && (
                          <button type="button" onClick={() => setMarkingConf(c)}
                            className="mt-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline">
                            Edit outcome
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* History timeline */}
          {timelineItems.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-heading text-base font-semibold text-foreground">History</h2>
                <p className="text-xs text-muted-foreground">Tap an item for details.</p>
              </CardHeader>
              <CardContent>
                <ul className="relative space-y-0 pl-4">
                  <span className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200" aria-hidden />
                  {timelineItems.map((item) => {
                    const isOpen = expanded.has(item.key);
                    const d = item.details;
                    return (
                      <li key={item.key} className="relative pb-4 last:pb-0">
                        <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => toggleExpand(item.key)}>
                          <span className={cn("mt-1 size-3 shrink-0 rounded-full ring-2 ring-white", item.dot)} />
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-sm font-medium", item.color)}>{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.sub}</p>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                          </div>
                          {isOpen
                            ? <ChevronDown className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                            : <ChevronRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" />}
                        </button>
                        {isOpen && (
                          <div className="ml-6 mt-2 space-y-2">
                            {d.type === "case" && (
                              <>
                                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-foreground/90 ring-1 ring-black/5">{d.reason}</p>
                                {d.riskFactors.length > 0 && (
                                  <ul className="space-y-1">
                                    {d.riskFactors.map((f, i) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/75">
                                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />{f}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {d.resolutionNote && (
                                  <div className="rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                                    <p className="mb-0.5 text-xs font-medium text-emerald-700">Resolution · {d.resolvedAt}</p>
                                    <p className="text-xs text-emerald-800">{d.resolutionNote}</p>
                                  </div>
                                )}
                              </>
                            )}
                            {d.type === "conference" && (
                              <>
                                <p className="text-xs text-muted-foreground">Parent/Guardian: <span className="font-medium text-foreground">{d.parent}</span></p>
                                {d.outcomeType && (
                                  <p className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 inline-block", OUTCOME_OPTIONS.find((x) => x.value === d.outcomeType)?.color ?? "")}>
                                    {OUTCOME_OPTIONS.find((x) => x.value === d.outcomeType)?.label}
                                  </p>
                                )}
                                {d.outcomeNote
                                  ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-emerald-200">{d.outcomeNote}</p>
                                  : <p className="text-xs italic text-muted-foreground">No outcome note.</p>}
                              </>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Good standing */}
          {activeCases.length === 0 && !referral && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="size-7 text-emerald-500" />
                <p className="text-sm font-medium text-foreground">Good standing</p>
                <p className="text-xs text-muted-foreground">No active cases or referrals.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
