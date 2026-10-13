import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import {
  listVirtualInternshipsAction,
  listInternshipEnrollmentsAction,
  getMyInternshipPortfolioAction,
  seedStandardVirtualInternshipsAction,
} from "@/actions/internships";
import { StudentInternshipsView } from "@/components/internships/student-internships-view";

export const metadata: Metadata = {
  title: "Virtual Internships & Simulated Experience — KSITM Careers",
  description:
    "Explore simulated industry workplace experiences, complete deliverable milestones, submit polymorphic outcomes, and build a verified career portfolio.",
};

export const dynamic = "force-dynamic";

export default async function StudentInternshipsPage() {
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

  // Fetch or seed catalog
  let catalog = await listVirtualInternshipsAction();
  if (catalog.length === 0) {
    await seedStandardVirtualInternshipsAction();
    catalog = await listVirtualInternshipsAction();
  }

  // Fetch personal enrollments
  const enrollments = await listInternshipEnrollmentsAction({
    studentId: student.id,
  });

  // Fetch portfolio data
  const portfolioResult = await getMyInternshipPortfolioAction();
  const portfolioData = portfolioResult.data || {
    totalEnrolled: enrollments.length,
    totalApproved: enrollments.filter((e) => e.status === "APPROVED").length,
    totalSubmitted: enrollments.filter((e) => e.status === "SUBMITTED").length,
    averageScore: null,
    enrollments,
  };

  return (
    <main className="min-h-screen bg-[#070714] px-4 py-8 sm:py-12 text-white selection:bg-[#FF7F24]/30">
      <div className="mx-auto max-w-7xl">
        <StudentInternshipsView
          initialCatalog={catalog}
          initialEnrollments={enrollments}
          initialPortfolio={portfolioData}
          studentName={student.fullName}
          regNumber={student.regNumber}
          department={student.department}
        />
      </div>
    </main>
  );
}
