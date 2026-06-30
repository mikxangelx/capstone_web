"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GuidanceStudentProfile } from "@/components/dashboard/guidance-student-profile";
import { getUsers, getServerUsers, subscribe } from "@/lib/users";

export default function GuidanceStudentDetailPage() {
  const { id } = useParams();
  const users = useSyncExternalStore(subscribe, getUsers, getServerUsers);
  const student = users.find((u) => u.id === id) ?? null;

  if (!student) {
    return (
      <div className="space-y-4">
        <Link
          href="/guidance/students"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to Students
        </Link>
        <p className="text-sm text-muted-foreground">Student not found.</p>
      </div>
    );
  }

  return <GuidanceStudentProfile student={student} />;
}
