// Derives a per-student profile (attendance standing + AI-preview
// recommendations) from the deterministic mock attendance data. Swap the
// data source for real API queries when a backend exists.

import { getAttendanceForStudent, summarize, toISODate } from "@/lib/mock-data";

/**
 * Compute a student's attendance standing over a recent window.
 * Returns the raw history plus summary counts and derived metrics.
 */
export function getStudentStanding(name, days = 30) {
  const history = getAttendanceForStudent(name, days);
  const counts = summarize(history); // { present, late, absent, excused }
  const total = history.length || 1;
  const rate = Math.round((counts.present / total) * 100);
  return {
    history,
    counts,
    total: history.length,
    rate,
    absences: counts.absent,
    lates: counts.late,
    // Below 75% is the usual intervention threshold.
    needsAttention: rate < 75 || counts.absent >= 6,
  };
}

/**
 * AI-preview prescriptive recommendations based on a student's standing.
 * Mirrors the tone of the seeded case `aiMeasures`; real output will come from
 * the AI model once connected.
 */
export function prescriptiveFor({ rate, absences, lates }) {
  const recs = [];

  if (rate < 75 || absences >= 6) {
    recs.push(
      "Attendance is below the 75% intervention threshold — refer for a parent conference and create an attendance recovery plan with weekly follow-ups."
    );
    recs.push(
      "Request medical or home documentation for any unexcused absences."
    );
  } else if (absences >= 3) {
    recs.push(
      "Absences are rising — send an early parent advisory before the pattern escalates."
    );
  }

  if (lates >= 5) {
    recs.push(
      "Frequent tardiness — schedule a brief check-in to identify the cause (transport, sleep, home routine) and set a 2-week punctuality goal."
    );
  } else if (lates >= 2) {
    recs.push(
      "Occasional late arrivals — a gentle punctuality reminder is recommended."
    );
  }

  if (recs.length === 0) {
    recs.push(
      "Attendance is healthy — continue routine monitoring and positive reinforcement."
    );
  }

  return recs;
}

/**
 * AI-prescribed conference slots: a few appropriate date + time options that
 * guidance can choose from based on their availability. Picks upcoming
 * weekdays at school-friendly times, skipping weekends. (Stand-in for the AI
 * model's scheduling suggestion until it's connected.)
 */
export function suggestConferenceSlots(count = 4) {
  const times = ["09:00", "10:30", "13:30", "15:00"];
  const slots = [];
  const today = new Date();
  let offset = 1;
  while (slots.length < count && offset < 30) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    offset++;
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue; // no weekends
    slots.push({ date: toISODate(day), time: times[slots.length % times.length] });
  }
  return slots;
}

/** Recommended one-line action derived from the standing. */
export function recommendedAction({ rate, absences, lates }) {
  if (rate < 75 || absences >= 6) return "Refer for parent conference (urgent)";
  if (absences >= 3) return "Parent advisory + monitoring";
  if (lates >= 5) return "Punctuality monitoring";
  return "Monitor";
}
