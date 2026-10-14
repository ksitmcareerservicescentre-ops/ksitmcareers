import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { getCurrentUser, ensureStudentProfileForUser } from "@/lib/auth/session";
import { ResumeBuilderWorkspace } from "@/components/admin/resume-builder-workspace";

export const metadata: Metadata = {
  title: "Professional Resume Studio — KSITM Careers",
  description:
    "Build, audit, and export Harvard ATS-compliant resumes with real-time feedback and keyword optimization at KSITM.",
};

export const dynamic = "force-dynamic";

export default async function StudentResumePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let studentId = user.studentProfile?.id;
  if (!studentId) {
    const [found] = await db
      .select({ id: studentProfiles.id })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, user.id))
      .limit(1);

    if (found) {
      studentId = found.id;
    } else {
      const healed = await ensureStudentProfileForUser(user.id, user.email);
      if (healed) studentId = healed.id;
    }
  }

  if (!studentId) redirect("/login");

  return (
    <main className="min-h-screen bg-[#070714] px-4 py-8 sm:py-10 text-white selection:bg-[#FF7F24]/30">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-arrow-left text-[10px]" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs font-mono text-orange-400">
            Student Entitlement: Resume Builder (Active)
          </span>
        </div>

        <ResumeBuilderWorkspace studentMode={true} studentId={studentId} />
      </div>
    </main>
  );
}
