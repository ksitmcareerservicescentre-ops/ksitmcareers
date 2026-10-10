import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { assessmentAttempts, assessments, assessmentQuestions, studentProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "My Career Assessments — KSITM Careers",
  description: "View and take your assigned job readiness assessments, tests, and examinations.",
};

export const dynamic = "force-dynamic";

export default async function StudentAssessmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT" || !user.studentProfile) {
    redirect(user.role === "SUPER_ADMIN" ? "/admin" : "/staff");
  }

  const [student] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, user.id))
    .limit(1);

  if (!student) redirect("/login");

  // Fetch all assigned assessments for this student
  const rows = await db
    .select({
      attemptId: assessmentAttempts.id,
      assessmentId: assessments.id,
      title: assessments.title,
      description: assessments.description,
      category: assessments.category,
      timeLimitMinutes: assessments.timeLimitMinutes,
      passingScore: assessments.passingScore,
      status: assessmentAttempts.status,
      score: assessmentAttempts.score,
      completedAt: assessmentAttempts.completedAt,
      assignedAt: assessmentAttempts.createdAt,
    })
    .from(assessmentAttempts)
    .innerJoin(assessments, eq(assessmentAttempts.assessmentId, assessments.id))
    .where(eq(assessmentAttempts.studentId, student.id))
    .orderBy(desc(assessmentAttempts.createdAt));

  // Count questions for each
  const assignedList = [];
  for (const r of rows) {
    const qRows = await db
      .select({ id: assessmentQuestions.id })
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentId, r.assessmentId));
    assignedList.push({
      ...r,
      totalQuestions: qRows.length,
      passed: r.score !== null ? r.score >= r.passingScore : null,
    });
  }

  const totalAssigned = assignedList.length;
  const inProgressCount = assignedList.filter((a) => a.status === "IN_PROGRESS").length;
  const completedList = assignedList.filter((a) => a.status === "SUBMITTED" || a.status === "REVIEWED");
  const completedCount = completedList.length;
  const averageScore =
    completedCount > 0
      ? Math.round(completedList.reduce((acc, c) => acc + (c.score || 0), 0) / completedCount)
      : null;

  return (
    <main className="min-h-screen bg-[#070714] px-4 py-12 text-white selection:bg-[#FF7F24]/30">
      <div className="mx-auto max-w-5xl space-y-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:border-orange-500/30 hover:bg-white/10 hover:text-white"
        >
          <span>←</span> Back to Dashboard
        </Link>

        {/* Header Strip */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end border-b border-white/[0.08] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">
              <i className="fas fa-clipboard-check text-xs" />
              <span>Assigned Examinations</span>
            </div>
            <h1 className="font-academic mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              Job Readiness Assessments
            </h1>
            <p className="mt-2 text-sm text-gray-400 max-w-2xl">
              Take official objective examinations assigned to your matriculation profile by KSITM Career Services. Test your competence across NACE 8 competencies, ATS optimization, and industry readiness.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl border border-white/[0.08] bg-[#101026] px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-mono text-gray-400 block">Assigned</span>
              <span className="text-lg font-bold text-white">{totalAssigned}</span>
            </div>
            {inProgressCount > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center">
                <span className="text-[10px] uppercase font-mono text-amber-400 block">In Progress</span>
                <span className="text-lg font-bold text-amber-400">{inProgressCount}</span>
              </div>
            )}
            <div className="rounded-xl border border-white/[0.08] bg-[#101026] px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-mono text-gray-400 block">Completed</span>
              <span className="text-lg font-bold text-emerald-400">{completedCount}</span>
            </div>
            {averageScore !== null && (
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-center">
                <span className="text-[10px] uppercase font-mono text-orange-400 block">Avg Score</span>
                <span className="text-lg font-bold text-orange-400">{averageScore}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Assessment Cards List */}
        {assignedList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-[#0e0e22]/50 p-12 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-2xl">
              <i className="fas fa-clipboard-list" />
            </div>
            <h2 className="font-academic text-xl font-bold text-white">No Assessments Assigned Yet</h2>
            <p className="mx-auto max-w-md text-xs text-gray-400 leading-relaxed">
              You do not have any active assessments pending at this time. Once your Career Guidance Officer or Administrator assigns an exam to your department or cohort, it will appear here immediately.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {assignedList.map((item) => {
              const isCompleted = item.status === "SUBMITTED" || item.status === "REVIEWED";
              const isInProgress = item.status === "IN_PROGRESS";
              return (
                <div
                  key={item.attemptId}
                  className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0d0d22] p-6 shadow-xl transition-all hover:border-orange-500/30"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                        {item.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : isInProgress
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Assigned"}
                      </span>
                    </div>

                    <h2 className="font-academic mt-3 text-xl font-bold text-white">
                      {item.title}
                    </h2>
                    <p className="mt-1.5 text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-b border-white/[0.06] py-3 text-center">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-gray-500 block">Questions</span>
                        <span className="text-sm font-bold text-white">{item.totalQuestions} Obj</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-gray-500 block">Time Limit</span>
                        <span className="text-sm font-bold text-orange-400">{item.timeLimitMinutes} Mins</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-gray-500 block">Pass Mark</span>
                        <span className="text-sm font-bold text-emerald-400">{item.passingScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                    {isCompleted ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-white">
                          Score: {item.score}%
                        </span>
                        {item.passed ? (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            PASSED
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
                            BELOW TARGET
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {isInProgress ? "In-progress attempt saved" : "Ready to take"}
                      </span>
                    )}

                    <Link
                      href={`/dashboard/assessments/${item.attemptId}`}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        isCompleted
                          ? "border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
                          : "bg-gradient-to-r from-orange-500 to-amber-600 text-[#090915] shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-95"
                      }`}
                    >
                      <span>
                        {isCompleted
                          ? "View Results & Review"
                          : isInProgress
                          ? "Resume Assessment →"
                          : "Start Assessment →"}
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
