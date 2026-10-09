import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { moduleAssignments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { StudentModule } from "@/components/modules/student-module";

export const metadata = { title: "Student Module" };
export const dynamic = "force-dynamic";
export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT" || !user.studentProfile)
    redirect(user.role === "SUPER_ADMIN" ? "/admin" : "/staff");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [record] = await db
    .select()
    .from(moduleAssignments)
    .where(
      and(
        eq(moduleAssignments.id, id),
        eq(moduleAssignments.studentId, user.studentProfile.id),
      ),
    );
  if (!record) notFound();
  return (
    <main className="min-h-screen bg-[#0A0A1A] px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/dashboard/modules" className="text-orange-300">
          ← My Modules
        </Link>
        <StudentModule initial={record} />
      </div>
    </main>
  );
}
