"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  consultationRequests,
  studentProfiles,
  staffProfiles,
  studentOccurrences,
  studentServiceEntitlements,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

export type AppointmentItem = {
  id: string;
  source: "APPOINTMENT" | "REQUEST";
  requestId?: string;
  studentId: string;
  studentName: string;
  studentRegNumber: string;
  studentDepartment: string | null;
  studentLevel: string | null;
  staffId: string | null;
  staffName: string | null;
  category: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  preferredDate?: string;
  preferredTimeSlot?: string;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  meetingLocation: string;
  reason: string;
  studentNotes?: string | null;
  internalStaffNotes?: string | null;
  createdAt: Date;
};

/**
 * Super Admin & Staff: List appointments categorized into Pending, Active, Completed.
 * If Career Staff, only appointments assigned to them (plus pending unassigned requests) are returned.
 */
export async function listSchedulerAppointmentsAction(): Promise<{
  pending: AppointmentItem[];
  active: AppointmentItem[];
  completed: AppointmentItem[];
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    throw new Error("Unauthorized.");
  }

  let staffProfileId: string | null = null;
  if (currentUser.role === "STAFF") {
    const [staff] = await db
      .select({ id: staffProfiles.id })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, currentUser.id))
      .limit(1);
    staffProfileId = staff?.id || null;
  }

  // 1. Fetch consultation requests (Pending unassigned queue)
  const reqRows = await db
    .select({
      id: consultationRequests.id,
      studentId: consultationRequests.studentId,
      category: consultationRequests.category,
      reason: consultationRequests.reason,
      preferredDate: consultationRequests.preferredDate,
      preferredTimeSlot: consultationRequests.preferredTimeSlot,
      status: consultationRequests.status,
      studentNotes: consultationRequests.studentNotes,
      createdAt: consultationRequests.createdAt,
      studentName: studentProfiles.fullName,
      studentRegNumber: studentProfiles.regNumber,
      studentDepartment: studentProfiles.department,
      studentLevel: studentProfiles.level,
    })
    .from(consultationRequests)
    .innerJoin(studentProfiles, eq(consultationRequests.studentId, studentProfiles.id))
    .where(or(eq(consultationRequests.status, "REQUESTED"), eq(consultationRequests.status, "UNDER_REVIEW")))
    .orderBy(desc(consultationRequests.createdAt));

  // 2. Fetch scheduled appointments
  const apptRows = await db
    .select({
      id: appointments.id,
      requestId: appointments.consultationRequestId,
      studentId: appointments.studentId,
      staffId: appointments.staffId,
      scheduledStart: appointments.scheduledStart,
      scheduledEnd: appointments.scheduledEnd,
      status: appointments.status,
      meetingLocation: appointments.meetingLocation,
      studentVisibleNotes: appointments.studentVisibleNotes,
      internalStaffNotes: appointments.internalStaffNotes,
      createdAt: appointments.createdAt,
      studentName: studentProfiles.fullName,
      studentRegNumber: studentProfiles.regNumber,
      studentDepartment: studentProfiles.department,
      studentLevel: studentProfiles.level,
      staffName: staffProfiles.fullName,
    })
    .from(appointments)
    .innerJoin(studentProfiles, eq(appointments.studentId, studentProfiles.id))
    .leftJoin(staffProfiles, eq(appointments.staffId, staffProfiles.id))
    .orderBy(desc(appointments.scheduledStart));

  // Filter for staff if not Super Admin
  const filteredAppts =
    currentUser.role === "SUPER_ADMIN" || !staffProfileId
      ? apptRows
      : apptRows.filter((a) => a.staffId === staffProfileId);

  const pending: AppointmentItem[] = reqRows.map((r) => ({
    id: r.id,
    source: "REQUEST",
    requestId: r.id,
    studentId: r.studentId,
    studentName: r.studentName,
    studentRegNumber: r.studentRegNumber,
    studentDepartment: r.studentDepartment,
    studentLevel: r.studentLevel,
    staffId: null,
    staffName: "Unassigned",
    category: r.category,
    status: "PENDING",
    preferredDate: r.preferredDate ? String(r.preferredDate) : undefined,
    preferredTimeSlot: r.preferredTimeSlot,
    scheduledStart: null,
    scheduledEnd: null,
    meetingLocation: "Career Advisory Centre",
    reason: r.reason,
    studentNotes: r.studentNotes,
    createdAt: r.createdAt,
  }));

  const active: AppointmentItem[] = [];
  const completed: AppointmentItem[] = [];

  for (const a of filteredAppts) {
    const item: AppointmentItem = {
      id: a.id,
      source: "APPOINTMENT",
      requestId: a.requestId || undefined,
      studentId: a.studentId,
      studentName: a.studentName,
      studentRegNumber: a.studentRegNumber,
      studentDepartment: a.studentDepartment,
      studentLevel: a.studentLevel,
      staffId: a.staffId,
      staffName: a.staffName || "Staff Officer",
      category: "Advisory Consultation",
      status:
        a.status === "SCHEDULED" || a.status === "RESCHEDULED"
          ? "ACTIVE"
          : a.status === "COMPLETED"
            ? "COMPLETED"
            : a.status === "NO_SHOW"
              ? "NO_SHOW"
              : "CANCELLED",
      scheduledStart: a.scheduledStart,
      scheduledEnd: a.scheduledEnd,
      meetingLocation: a.meetingLocation,
      reason: a.studentVisibleNotes || "Career Consultation Session",
      internalStaffNotes: a.internalStaffNotes,
      createdAt: a.createdAt,
    };

    if (item.status === "ACTIVE") {
      active.push(item);
    } else {
      completed.push(item);
    }
  }

  return { pending, active, completed };
}

/**
 * Super Admin & Staff: Schedule a pending request and assign to a Career Officer
 */
export async function scheduleAndAssignAppointmentAction(data: {
  requestId?: string;
  studentId: string;
  staffId: string;
  scheduledStart: string; // ISO date string
  scheduledEnd: string;   // ISO date string
  meetingLocation?: string;
  notes?: string;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    return { success: false, error: "Unauthorized access." };
  }

  if (!data.studentId || !data.staffId) {
    return { success: false, error: "Student and assigned staff officer are required." };
  }
  if (!data.scheduledStart || !data.scheduledEnd) {
    return { success: false, error: "Scheduled appointment start and end times are required." };
  }

  try {
    const startDate = new Date(data.scheduledStart);
    const endDate = new Date(data.scheduledEnd);

    // Fetch staff name
    const [staff] = await db
      .select({ fullName: staffProfiles.fullName })
      .from(staffProfiles)
      .where(eq(staffProfiles.id, data.staffId))
      .limit(1);

    const [created] = await db
      .insert(appointments)
      .values({
        consultationRequestId: data.requestId || null,
        studentId: data.studentId,
        staffId: data.staffId,
        scheduledStart: startDate,
        scheduledEnd: endDate,
        status: "SCHEDULED",
        meetingLocation: data.meetingLocation?.trim() || "Career Services Centre, KSITM",
        studentVisibleNotes: data.notes?.trim() || "Scheduled career advisory consultation.",
        internalStaffNotes: data.notes?.trim() || null,
      })
      .returning();

    // If originated from request, update request
    if (data.requestId) {
      await db
        .update(consultationRequests)
        .set({
          status: "SCHEDULED",
          reviewedByStaffId: data.staffId,
          updatedAt: new Date(),
        })
        .where(eq(consultationRequests.id, data.requestId));
    }

    // Automatically update student's academic file / occurrences
    await db.insert(studentOccurrences).values({
      studentId: data.studentId,
      actorUserId: currentUser.id,
      actorName: staff?.fullName || "Career Advisory",
      category: "OCCURRENCE",
      title: "Advisory Appointment Scheduled",
      description: `Formal consultation scheduled for ${startDate.toLocaleDateString()} with ${staff?.fullName || "Staff Officer"} at ${data.meetingLocation || "Career Services Centre"}.`,
    });

    await recordAuditLog({
      actorId: currentUser.id,
      action: "APPOINTMENT_SCHEDULED_ASSIGNED",
      entityType: "appointments",
      entityId: created.id,
      details: { staffId: data.staffId, studentId: data.studentId },
    });

    revalidatePath("/admin");
    revalidatePath("/staff");
    revalidatePath("/dashboard");

    return { success: true, appointmentId: created.id };
  } catch (err: unknown) {
    console.error("[scheduleAndAssignAppointmentAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to schedule appointment." };
  }
}

/**
 * Super Admin & Staff: Complete an appointment and log assessment note on student's dossier
 */
export async function completeAppointmentWithNotesAction(
  appointmentId: string,
  data: {
    status: "COMPLETED" | "NO_SHOW" | "CANCELLED";
    assessmentNote: string;
    actionPlan?: string;
  },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const [appt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appt) return { success: false, error: "Appointment not found." };

    await db
      .update(appointments)
      .set({
        status: data.status,
        internalStaffNotes: data.assessmentNote.trim(),
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    if (appt.consultationRequestId) {
      await db
        .update(consultationRequests)
        .set({
          status: data.status === "COMPLETED" ? "COMPLETED" : data.status,
          updatedAt: new Date(),
        })
        .where(eq(consultationRequests.id, appt.consultationRequestId));
    }

    // If completed, update entitlements and log milestone in student's file
    if (data.status === "COMPLETED") {
      await db
        .update(studentServiceEntitlements)
        .set({
          status: "ACTIVE",
          activatedAt: new Date(),
          recommendationNote: data.assessmentNote.slice(0, 200),
          updatedAt: new Date(),
        })
        .where(eq(studentServiceEntitlements.studentId, appt.studentId));

      let staffName = "Career Advisor";
      if (appt.staffId) {
        const [staff] = await db.select({ fullName: staffProfiles.fullName }).from(staffProfiles).where(eq(staffProfiles.id, appt.staffId)).limit(1);
        if (staff) staffName = staff.fullName;
      }

      await db.insert(studentOccurrences).values({
        studentId: appt.studentId,
        actorUserId: currentUser.id,
        actorName: staffName,
        category: "COUNSELING_NOTE",
        title: "Career Advisory Consultation Completed",
        description: data.assessmentNote.trim(),
        actionTaken: data.actionPlan?.trim() || "Entitlements active; student proceeding with milestone goals.",
      });
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "APPOINTMENT_OUTCOME_LOGGED",
      entityType: "appointments",
      entityId: appointmentId,
      details: { status: data.status },
    });

    revalidatePath("/admin");
    revalidatePath("/staff");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("[completeAppointmentWithNotesAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update appointment outcome." };
  }
}
