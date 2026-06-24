"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { UserPlus, Pencil, Trash2, Ban, CircleCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, DataTable } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import {
  getUsers,
  getServerUsers,
  subscribe,
  addUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  isStudent,
  isEmployee,
  STUDENT_ROLE,
  EMPLOYEE_ROLES,
} from "@/lib/users";

function useUsers() {
  return useSyncExternalStore(subscribe, getUsers, getServerUsers);
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const TABS = [
  { key: "employees", label: "Employees" },
  { key: "students", label: "Students" },
];

export default function UserManagementPage() {
  const users = useUsers();
  const [tab, setTab] = useState("employees");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // user being edited, or null for add

  // Search + filter state.
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // employees tab
  const [sectionFilter, setSectionFilter] = useState("all"); // students tab
  const [statusFilter, setStatusFilter] = useState("all"); // students tab

  const employees = useMemo(() => users.filter(isEmployee), [users]);
  const students = useMemo(() => users.filter(isStudent), [users]);

  const sections = useMemo(
    () => [...new Set(students.map((s) => s.section).filter(Boolean))].sort(),
    [students]
  );

  const isStudentTab = tab === "students";

  // Apply search + the active tab's filters.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (u) =>
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);

    if (isStudentTab) {
      return students.filter(
        (u) =>
          matchesQuery(u) &&
          (sectionFilter === "all" || u.section === sectionFilter) &&
          (statusFilter === "all" || u.status === statusFilter)
      );
    }
    return employees.filter(
      (u) => matchesQuery(u) && (roleFilter === "all" || u.role === roleFilter)
    );
  }, [isStudentTab, students, employees, query, roleFilter, sectionFilter, statusFilter]);
  // For Add: follow the active tab. For Edit: follow the user being edited.
  const formKind = editing
    ? editing.role === STUDENT_ROLE
      ? "student"
      : "employee"
    : isStudentTab
      ? "student"
      : "employee";

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (user) => {
    setEditing(user);
    setModalOpen(true);
  };
  const close = () => setModalOpen(false);

  const handleDelete = (user) => {
    if (window.confirm(`Delete ${user.name}? This cannot be undone.`)) {
      deleteUser(user.id);
      toast.success(`${user.name} deleted.`);
    }
  };

  const handleToggle = (user) => {
    toggleUserStatus(user.id);
    toast.success(
      user.status === "Disabled" ? `${user.name} enabled.` : `${user.name} disabled.`
    );
  };

  const actionsColumn = {
    key: "actions",
    label: "Actions",
    render: (user) => (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${user.name}`}
          onClick={() => openEdit(user)}
          className="text-slate-500 hover:text-primary"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={
            user.status === "Disabled" ? `Enable ${user.name}` : `Disable ${user.name}`
          }
          onClick={() => handleToggle(user)}
          className="text-slate-500 hover:text-amber-600"
        >
          {user.status === "Disabled" ? (
            <CircleCheck className="size-4" />
          ) : (
            <Ban className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${user.name}`}
          onClick={() => handleDelete(user)}
          className="text-slate-500 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    ),
  };

  const columns = isStudentTab
    ? [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "section", label: "Section" },
        { key: "status", label: "Status", badge: true },
        actionsColumn,
      ]
    : [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "status", label: "Status", badge: true },
        actionsColumn,
      ];

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage employee and student accounts separately."
        actions={
          <Button size="sm" onClick={openAdd}>
            <UserPlus className="size-4" />
            {isStudentTab ? "Add Student" : "Add Employee"}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="inline-flex rounded-full bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-foreground"
            )}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {(t.key === "students" ? students : employees).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="h-11 pl-9"
          />
        </div>

        {isStudentTab ? (
          <>
            <Select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="h-11 w-auto min-w-44"
            >
              <option value="all">All sections</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 w-auto min-w-36"
            >
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </Select>
          </>
        ) : (
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 w-auto min-w-48"
          >
            <option value="all">All roles</option>
            {EMPLOYEE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        empty={
          isStudentTab
            ? "No students match your filters."
            : "No employees match your filters."
        }
      />

      <Modal
        open={modalOpen}
        onClose={close}
        title={`${editing ? "Edit" : "Add"} ${
          formKind === "student" ? "Student" : "Employee"
        }`}
      >
        {modalOpen && (
          <UserForm kind={formKind} user={editing} onDone={close} />
        )}
      </Modal>
    </>
  );
}

function UserForm({ kind, user, onDone }) {
  const isStudentForm = kind === "student";
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? EMPLOYEE_ROLES[0]);
  const [section, setSection] = useState(user?.section ?? "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required.");
    if (!validateEmail(email)) return setError("Enter a valid email address.");

    const payload = isStudentForm
      ? { name, email, role: STUDENT_ROLE, section }
      : { name, email, role };

    if (user) {
      updateUser(user.id, payload);
      toast.success(`${isStudentForm ? "Student" : "Employee"} updated.`);
    } else {
      addUser(payload);
      toast.success(`${isStudentForm ? "Student" : "Employee"} added.`);
    }
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="u-name">Full name</Label>
        <Input
          id="u-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="Juan Dela Cruz"
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="u-email">Email</Label>
        <Input
          id="u-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="name@hhca.edu.ph"
          className="h-11"
        />
      </div>

      {isStudentForm ? (
        <div className="space-y-1.5">
          <Label htmlFor="u-section">Section</Label>
          <Input
            id="u-section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="Grade 10 - St. Peter"
            className="h-11"
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="u-role">Role</Label>
          <Select id="u-role" value={role} onChange={(e) => setRole(e.target.value)}>
            {EMPLOYEE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{user ? "Save changes" : "Add"}</Button>
      </div>
    </form>
  );
}
