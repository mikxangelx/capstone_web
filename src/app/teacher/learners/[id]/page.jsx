"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { StudentDetail } from "@/components/dashboard/student-detail";
import { getUsers, getServerUsers, subscribe } from "@/lib/users";

export default function TeacherLearnerDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const users = useSyncExternalStore(subscribe, getUsers, getServerUsers);
  const student = users.find((u) => u.id === id) ?? null;

  if (!student) {
    return (
      <div className="space-y-4">
        <Link
          href="/teacher/learners"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to Learner Status
        </Link>
        <p className="text-sm text-muted-foreground">Learner not found.</p>
      </div>
    );
  }

  return (
    <StudentDetail
      student={student}
      user={user}
      mode="teacher"
      backHref="/teacher/learners"
    />
  );
}
