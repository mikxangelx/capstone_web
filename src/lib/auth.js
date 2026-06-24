// Client-side mock authentication for the HHCA Attendance system.
// There is no backend yet, so credentials are seeded here and the active
// session is persisted in localStorage. Swap these helpers for real API
// calls when a backend is added.

export const ROLE_LABELS = {
  admin: "Administrator",
  teacher: "Teacher",
  guidance: "Guidance Counselor",
};

// Where each role lands after logging in.
export const ROLE_HOME = {
  admin: "/admin",
  teacher: "/teacher",
  guidance: "/guidance",
};

// Demo accounts. Replace with a real user store / API in production.
const SEEDED_USERS = [
  {
    id: "u-admin",
    name: "Admin User",
    email: "admin@hhca.edu.ph",
    password: "admin1234",
    role: "admin",
  },
  {
    id: "u-teacher",
    name: "Teacher User",
    email: "teacher@hhca.edu.ph",
    password: "teacher1234",
    role: "teacher",
  },
  {
    id: "u-guidance",
    name: "Guidance User",
    email: "guidance@hhca.edu.ph",
    password: "guidance1234",
    role: "guidance",
  },
];

const SESSION_KEY = "hhca:session";

/** Demo credentials surfaced on the login screen so testers can sign in. */
export const DEMO_CREDENTIALS = SEEDED_USERS.map(({ email, password, role }) => ({
  email,
  password,
  role,
}));

/** Validate credentials against the seeded users. */
export function authenticate(email, password) {
  const match = SEEDED_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (!match || match.password !== password) {
    return { error: "Incorrect email or password." };
  }
  const { password: _omit, ...user } = match;
  void _omit;
  return { user };
}

export function getSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
