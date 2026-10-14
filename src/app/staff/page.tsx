import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  staffProfiles,
  studentProfiles,
  appointments,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { StaffAdvisoryPortal } from "@/components/staff/staff-advisory-portal";

export const metadata: Metadata = {
  title: "Career Officer Portal — KSITM Careers",
  description:
    "Student advisory portal, appointment scheduling, and career service entitlements management.",
};

export const dynamic = "force-dynamic";

export default async function CareerOfficerPortalPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "STAFF" && user.role !== "SUPER_ADMIN") {
    if (user.role === "EMPLOYER") redirect("/employer");
    redirect("/dashboard");
  }

  // 1. Fetch staff profile
  const [officer] = await db
    .select()
    .from(staffProfiles)
    .where(eq(staffProfiles.userId, user.id))
    .limit(1);

  // 2. Fetch appointments and students assigned specifically to this staff officer
  const assignedAppointments = officer
    ? await db
        .select({
          appointmentId: appointments.id,
          studentId: appointments.studentId,
          status: appointments.status,
          scheduledStart: appointments.scheduledStart,
          meetingLocation: appointments.meetingLocation,
          notes: appointments.internalStaffNotes,
          studentName: studentProfiles.fullName,
          studentRegNumber: studentProfiles.regNumber,
          studentDepartment: studentProfiles.department,
          studentLevel: studentProfiles.level,
          studentPhone: studentProfiles.phone,
          studentEmail: users.email,
        })
        .from(appointments)
        .innerJoin(studentProfiles, eq(appointments.studentId, studentProfiles.id))
        .innerJoin(users, eq(studentProfiles.userId, users.id))
        .where(eq(appointments.staffId, officer.id))
        .orderBy(desc(appointments.scheduledStart))
    : [];

  return (
    <StaffAdvisoryPortal
      officer={{
        fullName: officer?.fullName || user.email.split("@")[0],
        staffCode: officer?.staffCode || null,
        designation: officer?.designation || null,
        email: user.email,
      }}
      assignedAppointments={assignedAppointments}
    />
  );
}
