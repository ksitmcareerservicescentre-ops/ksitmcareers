import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { assessmentAttempts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getStudentAttemptDetailAction } from "@/actions/assessments";
import { AssessmentExamClient } from "./exam-client";
import { AssessmentResultView } from "./result-view";

export const metadata: Metadata = {
  title: "Examination Session — KSITM Careers",
};

export const dynamic = "force-dynamic";

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: attemptId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT" || !user.studentProfile) {
    redirect(user.role === "SUPER_ADMIN" ? "/admin" : "/staff");
  }

  // Fetch attempt to check if already submitted
  const [attempt] = await db
    .select({
      id: assessmentAttempts.id,
      assessmentId: assessmentAttempts.assessmentId,
      status: assessmentAttempts.status,
      score: assessmentAttempts.score,
    })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.id, attemptId),
        eq(assessmentAttempts.studentId, user.studentProfile.id),
      ),
    )
    .limit(1);

  if (!attempt) {
    redirect("/dashboard/assessments");
  }

  // If already submitted, show full results and review
  if (attempt.status === "SUBMITTED" || attempt.status === "REVIEWED") {
    const details = await getStudentAttemptDetailAction(attemptId);
    if (!details) redirect("/dashboard/assessments");
    return <AssessmentResultView details={details} />;
  }

  // Otherwise, load active examination client
  return <AssessmentExamClient attemptId={attemptId} />;
}
