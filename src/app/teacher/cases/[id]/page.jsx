"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { CaseDetail } from "@/components/dashboard/case-detail";
import { getCaseById } from "@/lib/mock-data";

export default function TeacherCaseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const caseData = getCaseById(id);

  if (!caseData) {
    return (
      <div className="space-y-4">
        <Link
          href="/teacher/cases"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to Cases
        </Link>
        <p className="text-sm text-muted-foreground">Case not found.</p>
      </div>
    );
  }

  return <CaseDetail caseData={caseData} user={user} backHref="/teacher/cases" />;
}
