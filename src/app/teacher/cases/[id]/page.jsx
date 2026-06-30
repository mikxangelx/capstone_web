"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { CaseDetail } from "@/components/dashboard/case-detail";
import { getCaseById } from "@/lib/mock-data";

export default function TeacherCaseDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const caseData = getCaseById(id);

  const fromDashboard = searchParams.get("from") === "dashboard";
  const backHref = fromDashboard ? "/teacher" : "/teacher/cases";
  const backLabel = fromDashboard ? "Back to Dashboard" : "Back to Cases";

  if (!caseData) {
    return (
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
        <p className="text-sm text-muted-foreground">Case not found.</p>
      </div>
    );
  }

  return <CaseDetail caseData={caseData} user={user} backHref={backHref} backLabel={backLabel} />;
}
