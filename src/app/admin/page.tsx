import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { site } from "@/config/site";
import { eq, desc, and, or, like, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  staffProfiles,
  studentProfiles,
  auditLogs,
  appointments,
  galleryItems,
  leadershipProfiles,
  announcements,
  trainingVideos,
  trainingCategories,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/actions/auth";
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

  // 3. Fetch module-related audit logs (strictly module content, never USER_LOGIN)
  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(
      and(
        ne(auditLogs.action, "USER_LOGIN"),
        or(
          like(auditLogs.action, "MODULE_%"),
          inArray(auditLogs.entityType, [
            "learning_modules",
            "module_assignments",
          ]),
        ),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(10);

  const appointmentRows = await db
    .select({
      id: appointments.id,
      studentName: studentProfiles.fullName,
      status: appointments.status,
      scheduledStart: appointments.scheduledStart,
      staffName: staffProfiles.fullName,
    })
    .from(appointments)
    .innerJoin(studentProfiles, eq(appointments.studentId, studentProfiles.id))
    .leftJoin(staffProfiles, eq(appointments.staffId, staffProfiles.id))
    .orderBy(desc(appointments.scheduledStart))
    .limit(50);

  const [gallery, leadership, publicAnnouncements] = await Promise.all([
    db
      .select()
      .from(galleryItems)
      .orderBy(galleryItems.displayOrder, desc(galleryItems.createdAt)),
    db
      .select()
      .from(leadershipProfiles)
      .orderBy(
        leadershipProfiles.displayOrder,
        desc(leadershipProfiles.createdAt),
      ),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)),
  ]);
  const training = await db
    .select({
      id: trainingVideos.id,
      title: trainingVideos.title,
      description: trainingVideos.description,
      videoUrl: trainingVideos.videoUrl,
      videoId: trainingVideos.videoId,
      videoProvider: trainingVideos.videoProvider,
      thumbnailUrl: trainingVideos.thumbnailUrl,
      instructor: trainingVideos.instructor,
      isPublished: trainingVideos.isPublished,
      categoryName: trainingCategories.name,
    })
    .from(trainingVideos)
    .innerJoin(
      trainingCategories,
      eq(trainingVideos.categoryId, trainingCategories.id),
    )
    .orderBy(trainingVideos.displayOrder, desc(trainingVideos.createdAt));

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white">
      {/* Top Admin Header */}
      <header className="fixed inset-x-0 top-0 z-40 bg-[#0A0A1A]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center group" aria-label="KSITM Home">
            <Image
              src={site.shield}
              alt="KSITM Logo"
              width={28}
              height={28}
              className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
          </Link>
          <span className="sr-only">Super Admin Central</span>
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

      <main className="min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <AdminControlCenter
          appointments={appointmentRows}
          gallery={gallery}
          leadership={leadership}
          announcements={publicAnnouncements}
          training={training}
          officers={officers}
          students={students}
          logs={logs}
          defaultTab="assessments"
        />
      </main>
    </div>
  );
}
