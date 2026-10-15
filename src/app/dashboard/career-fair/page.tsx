import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { getCurrentUser, ensureStudentProfileForUser } from "@/lib/auth/session";
import { listCareerFairsAction } from "@/actions/career-fairs";
import { StudentCareerFairView } from "@/components/career-fair/student-career-fair-view";

export const metadata: Metadata = {
  title: "Career Fairs & Expos — KSITM Careers",
  description:
    "Explore employer booths, interact with corporate recruiters, and access official event entry passes.",
};

export const dynamic = "force-dynamic";

export default async function StudentCareerFairPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let student: {
    id: string;
    fullName: string;
    regNumber: string;
    department?: string | null;
    level?: string | null;
  } | null = user.studentProfile || null;

  if (!student) {
    const [found] = await db
      .select({
        id: studentProfiles.id,
        fullName: studentProfiles.fullName,
        regNumber: studentProfiles.regNumber,
        department: studentProfiles.department,
        level: studentProfiles.level,
      })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, user.id))
      .limit(1);

    if (found) {
      student = found;
    } else {
      const healed = await ensureStudentProfileForUser(user.id, user.email);
      if (healed) {
        student = {
          id: healed.id,
          fullName: healed.fullName,
          regNumber: healed.regNumber,
          department: healed.department,
          level: healed.level,
        };
      }
    }
  }

  if (!student) redirect("/login");

  const fairs = await listCareerFairsAction();

  return (
    <main className="min-h-screen bg-[#070714] px-4 py-8 sm:py-10 text-white selection:bg-rose-500/30">
      <div className="mx-auto max-w-7xl">
        <StudentCareerFairView initialFairs={fairs} student={student} />
      </div>
    </main>
  );
}
