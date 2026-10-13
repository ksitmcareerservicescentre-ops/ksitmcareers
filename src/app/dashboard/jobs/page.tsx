import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import {
  listJobPostingsAction,
  seedStandardJobsAction,
} from "@/actions/jobs";
import { getMyRecommendedJobsAction } from "@/actions/employers";
import { StudentJobsView } from "@/components/jobs/student-jobs-view";

export const metadata: Metadata = {
  title: "Job Board & Placements — KSITM Careers",
  description:
    "Explore verified job vacancies, industry partner placements, and personalized employment recommendations from KSITM Career Advisors.",
};

export const dynamic = "force-dynamic";

export default async function StudentJobsPage() {
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

  // Fetch or seed job postings
  let jobs = await listJobPostingsAction({ publishedOnly: true });
  if (jobs.length === 0) {
    await seedStandardJobsAction();
    jobs = await listJobPostingsAction({ publishedOnly: true });
  }

  // Fetch student's personal recommendations
  const recRes = await getMyRecommendedJobsAction();
  const recommendations = recRes.recommendations || [];

  return (
    <main className="min-h-screen bg-[#070714] px-4 py-8 sm:py-12 text-white selection:bg-[#FF7F24]/30">
      <div className="mx-auto max-w-7xl">
        <StudentJobsView
          initialJobs={jobs}
          initialRecommendations={recommendations}
          studentName={student.fullName}
          regNumber={student.regNumber}
          department={student.department}
        />
      </div>
    </main>
  );
}
