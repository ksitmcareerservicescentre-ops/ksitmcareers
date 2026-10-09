import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { moduleAssignments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { statusLabels } from "@/lib/modules";

export const metadata = { title: "My Modules" };
export const dynamic = "force-dynamic";

export default async function StudentModulesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT" || !user.studentProfile)
    redirect(user.role === "SUPER_ADMIN" ? "/admin" : "/staff");
  const assignments = await db
    .select({
      id: moduleAssignments.id,
      title: moduleAssignments.title,
      status: moduleAssignments.status,
      startedAt: moduleAssignments.startedAt,
      assignedAt: moduleAssignments.assignedAt,
      completedAt: moduleAssignments.completedAt,
    })
    .from(moduleAssignments)
    .where(eq(moduleAssignments.studentId, user.studentProfile.id))
    .orderBy(desc(moduleAssignments.assignedAt));
  const date = (value: Date | null) =>
    value
      ? value.toLocaleString("en-GB", { timeZone: "Africa/Lagos" })
      : "Not started";
  const completedCount = assignments.filter((a) => a.status === "COMPLETED").length;
  const inProgressCount = assignments.filter((a) => a.status === "IN_PROGRESS").length;

  return (
    <main className="min-h-screen bg-[#070714] px-4 py-12 text-white selection:bg-[#FF7F24]/30">
      <div className="mx-auto max-w-5xl space-y-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors hover:border-orange-500/30 hover:bg-white/10 hover:text-white"
        >
          <span>←</span> Back to Dashboard
        </Link>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">
              Student Career Activities
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              My Modules
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Track your assigned activities, saved progress, and completed work. Times shown in West Africa Time (WAT).
            </p>
          </div>
          {assignments.length > 0 && (
            <div className="flex gap-2">
              <div className="rounded-xl border border-white/[0.08] bg-[#111126] px-4 py-2.5 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">In Progress</p>
                <p className="text-lg font-bold text-orange-400">{inProgressCount}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#111126] px-4 py-2.5 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Completed</p>
                <p className="text-lg font-bold text-emerald-400">{completedCount}</p>
              </div>
            </div>
          )}
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center backdrop-blur-sm">
            <p className="text-base font-semibold text-gray-200">
              No modules have been assigned yet.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Your career adviser will assign targeted development modules as part of your career readiness plan.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {assignments.map((item) => {
              const statusBadge =
                item.status === "COMPLETED"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : item.status === "IN_PROGRESS"
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                    : "border-blue-500/30 bg-blue-500/10 text-blue-400";

              return (
                <section
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111126] to-[#0b0b1c] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.35)] backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status === "COMPLETED"
                              ? "bg-emerald-400"
                              : item.status === "IN_PROGRESS"
                                ? "bg-orange-400 animate-pulse"
                                : "bg-blue-400"
                          }`}
                        />
                        {statusLabels[item.status]}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white">
                      {item.title}
                    </h2>
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-gray-400">
                      <div>
                        <span className="block text-[11px] text-gray-500">Assigned</span>
                        <span className="font-medium text-gray-300">{date(item.assignedAt)}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-gray-500">Started</span>
                        <span className="font-medium text-gray-300">{date(item.startedAt)}</span>
                      </div>
                      {item.completedAt && (
                        <div className="col-span-2 pt-1 border-t border-white/[0.04]">
                          <span className="block text-[11px] text-emerald-500/80">Completed</span>
                          <span className="font-medium text-emerald-300">{date(item.completedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link
                      className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#FF7F24] via-[#ff9042] to-[#FF7F24] px-5 py-2.5 text-sm font-bold text-[#090915] shadow-[0_2px_14px_rgba(255,127,36,0.28)] transition-all duration-150 hover:shadow-[0_4px_22px_rgba(255,127,36,0.45)] hover:brightness-105 active:scale-[0.98]"
                      href={`/dashboard/modules/${item.id}`}
                    >
                      {item.status === "COMPLETED"
                        ? "View completed module →"
                        : item.status === "IN_PROGRESS"
                          ? "Continue module →"
                          : "Open module →"}
                    </Link>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
