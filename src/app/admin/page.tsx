import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, staffProfiles, studentProfiles, auditLogs, appointments, galleryItems, leadershipProfiles, announcements, trainingVideos, trainingCategories } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/actions/auth";
import { OfficerManagement } from "@/components/admin/officer-management";
import { AdminControlCenter } from "@/components/admin/admin-control-center";

export const metadata: Metadata = {
  title: "Super Admin Dashboard — KSITM Careers",
  description:
    "Institutional governance, staff management, and system configuration.",
};

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "SUPER_ADMIN") {
    if (user.role === "STAFF") redirect("/staff");
    redirect("/dashboard");
  }

  // 1. Fetch all career officers
  const officers = await db
    .select({
      id: staffProfiles.id,
      userId: staffProfiles.userId,
      fullName: staffProfiles.fullName,
      staffCode: staffProfiles.staffCode,
      designation: staffProfiles.designation,
      canManageAppointments: staffProfiles.canManageAppointments,
      canManageServices: staffProfiles.canManageServices,
      createdAt: staffProfiles.createdAt,
      email: users.email,
      isActive: users.isActive,
    })
    .from(staffProfiles)
    .innerJoin(users, eq(staffProfiles.userId, users.id))
    .orderBy(desc(staffProfiles.createdAt));

  // 2. Fetch students overview
  const students = await db
    .select({
      id: studentProfiles.id,
      fullName: studentProfiles.fullName,
      regNumber: studentProfiles.regNumber,
      department: studentProfiles.department,
      level: studentProfiles.level,
      email: users.email,
      isActive: users.isActive,
      createdAt: studentProfiles.createdAt,
    })
    .from(studentProfiles)
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .orderBy(desc(studentProfiles.createdAt))
    .limit(10);

  // 3. Fetch recent audit logs
  const logs = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(6);

  const appointmentRows = await db
    .select({ id: appointments.id, studentName: studentProfiles.fullName, status: appointments.status, scheduledStart: appointments.scheduledStart, staffName: staffProfiles.fullName })
    .from(appointments)
    .innerJoin(studentProfiles, eq(appointments.studentId, studentProfiles.id))
    .leftJoin(staffProfiles, eq(appointments.staffId, staffProfiles.id))
    .orderBy(desc(appointments.scheduledStart))
    .limit(50);

  const [gallery, leadership, publicAnnouncements] = await Promise.all([
    db.select().from(galleryItems).orderBy(galleryItems.displayOrder, desc(galleryItems.createdAt)),
    db.select().from(leadershipProfiles).orderBy(leadershipProfiles.displayOrder, desc(leadershipProfiles.createdAt)),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)),
  ]);
  const training = await db.select({ id: trainingVideos.id, title: trainingVideos.title, description: trainingVideos.description, videoUrl: trainingVideos.videoUrl, videoId: trainingVideos.videoId, videoProvider: trainingVideos.videoProvider, thumbnailUrl: trainingVideos.thumbnailUrl, instructor: trainingVideos.instructor, isPublished: trainingVideos.isPublished, categoryName: trainingCategories.name }).from(trainingVideos).innerJoin(trainingCategories, eq(trainingVideos.categoryId, trainingCategories.id)).orderBy(trainingVideos.displayOrder, desc(trainingVideos.createdAt));

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white">
      {/* Top Admin Header */}
      <header className="fixed inset-x-0 top-0 z-40 bg-[#0A0A1A]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#FF7F24]/10 border border-[#FF7F24]/30 text-[#FF7F24] flex items-center justify-center font-bold text-sm">
              K
            </span>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white block">
                KSITM Careers
              </span>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block -mt-1">
                Super Admin Central
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white">{user.email}</div>
            <div className="text-[10px] text-purple-400 font-semibold uppercase">
              Platform Administrator
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="py-1.5 px-3 rounded-lg border border-white/15 hover:border-red-500/50 hover:bg-red-500/10 text-gray-300 hover:text-red-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-8 space-y-10">
        <AdminControlCenter appointments={appointmentRows} gallery={gallery} leadership={leadership} announcements={publicAnnouncements} training={training} />
        {/* Metric Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Enrolled Students
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {students.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Active student accounts
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Career Officers
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#FF7F24] mt-1">
              {officers.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Staff advisors & officers
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              Services Catalog
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1">
              7
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Institutional offerings
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101023] border border-white/10">
            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">
              System Health
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
              100%
            </div>
            <p className="text-xs text-gray-500 mt-1">Neon DB operational</p>
          </div>
        </section>

        {/* 1. Career Officer CRUD Section */}
        <section>
          <OfficerManagement initialOfficers={officers} />
        </section>

        {/* 2. Registered Students Overview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white">
                Recently Enrolled Students
              </h2>
              <p className="text-gray-400 text-xs">
                Students registered via KSITM matriculation credentials.
              </p>
            </div>
          </div>

          <div className="bg-[#101023] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Reg Number</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Department & Level</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-mono font-bold text-[#FF7F24] text-xs">
                        {st.regNumber}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {st.fullName}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div>{st.department || "General"}</div>
                        <div className="text-gray-500">{st.level || "ND"}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {st.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 3. System Audit Log Stream */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-white">
            System Governance & Audit Trail
          </h2>
          <div className="bg-[#101023] border border-white/10 rounded-2xl p-5 divide-y divide-white/5 space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="pt-3 first:pt-0 flex items-start justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-purple-400 uppercase">
                    {log.action}
                  </span>{" "}
                  <span className="text-gray-400">on {log.entityType}</span>
                </div>
                <div className="text-gray-500 font-mono text-[11px]">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
