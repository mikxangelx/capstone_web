// Conference referrals: a teacher forwards a case to guidance (no date),
// and guidance plots the actual schedule. Backed by localStorage (mock).

const STORAGE_KEY = "hhca:referrals";
const CHANGE_EVENT = "hhca:referrals-changed";

const EMPTY = Object.freeze([]);
let cachedRaw = null;
let cachedList = EMPTY;

function base() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function persist(list) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Stable snapshot for useSyncExternalStore.
export function getReferrals() {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    cachedRaw = null;
    cachedList = EMPTY;
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  try {
    cachedList = JSON.parse(raw);
  } catch {
    cachedList = EMPTY;
  }
  return cachedList;
}

export function getServerReferrals() {
  return EMPTY;
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Teacher forwards a student/case to guidance (status starts as Pending).
 * `studentId` is set for student-centric referrals; `caseId` for the older
 * case-centric flow. Either may be present.
 */
export function addReferral({
  caseId,
  studentId,
  student,
  section,
  guardian,
  reason,
  fromName,
}) {
  const referral = {
    id: uid(),
    caseId: caseId ?? null,
    studentId: studentId ?? null,
    student,
    section: section ?? "",
    guardian: guardian ?? "",
    reason: (reason ?? "").trim(),
    fromName: fromName ?? "Teacher",
    status: "Pending",
    date: null,
    time: null,
    createdAt: Date.now(),
  };
  persist([referral, ...base()]);
  return referral;
}

/** Guidance plots the schedule. */
export function scheduleReferral(id, { date, time }) {
  persist(
    base().map((r) =>
      r.id === id ? { ...r, status: "Scheduled", date, time } : r
    )
  );
}

export function declineReferral(id) {
  persist(base().map((r) => (r.id === id ? { ...r, status: "Declined" } : r)));
}

export function subscribe(listener) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
