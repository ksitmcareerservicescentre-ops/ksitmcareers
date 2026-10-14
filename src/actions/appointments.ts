"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, or, and } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  consultationRequests,
  studentProfiles,
  staffProfiles,
  studentOccurrences,
  studentServiceEntitlements,
} from "@/db/schema";
import { getCurrentUser, ensureStudentProfileForUser } from "@/lib/auth/session";
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

export type StudentConsultationRequestItem = {
  id: string;
  category: string;
  reason: string;
  preferredDate: string;
  preferredTimeSlot: string;
  status: "REQUESTED" | "UNDER_REVIEW" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  studentNotes?: string | null;
  reviewedByStaffId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StudentScheduledAppointmentItem = {
  id: string;
  requestId?: string | null;
  staffId: string;
  staffName: string;
  staffDesignation?: string | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  meetingLocation: string;
  status: "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  studentVisibleNotes?: string | null;
  createdAt: Date;
};

/**
 * Student: Submit a new consultation request
 */
export async function requestConsultationAction(data: {
  category: string;
  reason: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeSlot: string; // e.g. "09:00 - 10:00 AM"
  studentNotes?: string;
}): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Please log in to submit a consultation request." };
    }

    let studentProfileId = currentUser.studentProfile?.id;
    if (!studentProfileId) {
      const [found] = await db
        .select({ id: studentProfiles.id })
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, currentUser.id))
        .limit(1);

      if (found) {
        studentProfileId = found.id;
      } else {
        const healed = await ensureStudentProfileForUser(currentUser.id, currentUser.email);
        if (healed) studentProfileId = healed.id;
      }
    }

    if (!studentProfileId) {
      return { success: false, error: "Student profile not found. Please contact administration." };
    }

    if (!data.category?.trim()) {
      return { success: false, error: "Please select a consultation category." };
    }
    if (!data.reason?.trim()) {
      return { success: false, error: "Please provide a reason or objective for the consultation." };
    }
    if (!data.preferredDate) {
      return { success: false, error: "Please select your preferred date." };
    }
    if (!data.preferredTimeSlot?.trim()) {
      return { success: false, error: "Please select a preferred time slot." };
    }

    const [created] = await db
      .insert(consultationRequests)
      .values({
        studentId: studentProfileId,
        category: data.category.trim(),
        reason: data.reason.trim(),
        preferredDate: data.preferredDate,
        preferredTimeSlot: data.preferredTimeSlot.trim(),
        studentNotes: data.studentNotes?.trim() || null,
        status: "REQUESTED",
      })
      .returning();

    // Log occurrence on student dossier
    await db.insert(studentOccurrences).values({
      studentId: studentProfileId,
      actorUserId: currentUser.id,
      actorName: currentUser.studentProfile?.fullName || currentUser.email,
      category: "OCCURRENCE",
      title: `Consultation Requested: ${data.category}`,
      description: `Student requested ${data.category} consultation for ${data.preferredDate} (${data.preferredTimeSlot}). Reason: ${data.reason.trim()}`,
    });

    await recordAuditLog({
      actorId: currentUser.id,
      action: "CONSULTATION_REQUEST_SUBMITTED",
      entityType: "consultation_requests",
      entityId: created.id,
      details: {
        category: data.category,
        preferredDate: data.preferredDate,
        preferredTimeSlot: data.preferredTimeSlot,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/staff");

    return { success: true, requestId: created.id };
  } catch (err: unknown) {
    console.error("[requestConsultationAction] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to place consultation request.",
    };
  }
}

/**
 * Student: Fetch own scheduled appointments and submitted consultation requests
 */
export async function getStudentAppointmentsAction(): Promise<{
  appointments: StudentScheduledAppointmentItem[];
  requests: StudentConsultationRequestItem[];
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { appointments: [], requests: [] };

  let studentProfileId = currentUser.studentProfile?.id;
  if (!studentProfileId) {
    const [found] = await db
      .select({ id: studentProfiles.id })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, currentUser.id))
      .limit(1);
    if (found) studentProfileId = found.id;
  }

  if (!studentProfileId) return { appointments: [], requests: [] };

  try {
    const appts = await db
      .select({
        id: appointments.id,
        requestId: appointments.consultationRequestId,
        staffId: appointments.staffId,
        staffName: staffProfiles.fullName,
        staffDesignation: staffProfiles.designation,
        scheduledStart: appointments.scheduledStart,
        scheduledEnd: appointments.scheduledEnd,
        meetingLocation: appointments.meetingLocation,
        status: appointments.status,
        studentVisibleNotes: appointments.studentVisibleNotes,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .leftJoin(staffProfiles, eq(appointments.staffId, staffProfiles.id))
      .where(eq(appointments.studentId, studentProfileId))
      .orderBy(desc(appointments.scheduledStart));

    const reqs = await db
      .select({
        id: consultationRequests.id,
        category: consultationRequests.category,
        reason: consultationRequests.reason,
        preferredDate: consultationRequests.preferredDate,
        preferredTimeSlot: consultationRequests.preferredTimeSlot,
        status: consultationRequests.status,
        studentNotes: consultationRequests.studentNotes,
        reviewedByStaffId: consultationRequests.reviewedByStaffId,
        createdAt: consultationRequests.createdAt,
        updatedAt: consultationRequests.updatedAt,
      })
      .from(consultationRequests)
      .where(eq(consultationRequests.studentId, studentProfileId))
      .orderBy(desc(consultationRequests.createdAt));

    return {
      appointments: appts.map((a) => ({
        id: a.id,
        requestId: a.requestId,
        staffId: a.staffId || "",
        staffName: a.staffName || "Career Services Officer",
        staffDesignation: a.staffDesignation,
        scheduledStart: a.scheduledStart,
        scheduledEnd: a.scheduledEnd,
        meetingLocation: a.meetingLocation || "Career Services Centre",
        status: a.status as "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
        studentVisibleNotes: a.studentVisibleNotes,
        createdAt: a.createdAt,
      })),
      requests: reqs.map((r) => ({
        id: r.id,
        category: r.category,
        reason: r.reason,
        preferredDate: String(r.preferredDate),
        preferredTimeSlot: r.preferredTimeSlot,
        status: r.status as "REQUESTED" | "UNDER_REVIEW" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
        studentNotes: r.studentNotes,
        reviewedByStaffId: r.reviewedByStaffId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  } catch (err) {
    console.error("[getStudentAppointmentsAction] Error:", err);
    return { appointments: [], requests: [] };
  }
}

/**
 * Student or Admin: Cancel a consultation request
 */
export async function cancelStudentConsultationAction(
  requestId: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: "Unauthorized." };

    const [req] = await db
      .select()
      .from(consultationRequests)
      .where(eq(consultationRequests.id, requestId))
      .limit(1);

    if (!req) return { success: false, error: "Consultation request not found." };

    // Permission check
    if (
      currentUser.role === "STUDENT" &&
      currentUser.studentProfile?.id !== req.studentId
    ) {
      return { success: false, error: "Access denied." };
    }

    await db
      .update(consultationRequests)
      .set({
        status: "CANCELLED",
        studentNotes: reason
          ? `${req.studentNotes || ""}\n[Cancellation Reason: ${reason}]`.trim()
          : req.studentNotes,
        updatedAt: new Date(),
      })
      .where(eq(consultationRequests.id, requestId));

    // Also cancel any linked appointment
    await db
      .update(appointments)
      .set({
        status: "CANCELLED",
        studentVisibleNotes: reason
          ? `Cancelled by student: ${reason}`
          : "Appointment cancelled.",
        updatedAt: new Date(),
      })
      .where(eq(appointments.consultationRequestId, requestId));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "CONSULTATION_REQUEST_CANCELLED",
      entityType: "consultation_requests",
      entityId: requestId,
      details: { reason },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/staff");

    return { success: true };
  } catch (err: unknown) {
    console.error("[cancelStudentConsultationAction] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel consultation request.",
    };
  }
}

/**
 * Student or Staff: Cancel a scheduled appointment
 */
export async function cancelStudentAppointmentAction(
  appointmentId: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: "Unauthorized." };

    const [appt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appt) return { success: false, error: "Appointment not found." };

    if (
      currentUser.role === "STUDENT" &&
      currentUser.studentProfile?.id !== appt.studentId
    ) {
      return { success: false, error: "Access denied." };
    }

    await db
      .update(appointments)
      .set({
        status: "CANCELLED",
        internalStaffNotes: reason
          ? `Cancelled. Note: ${reason}`
          : "Cancelled by student or staff.",
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId));

    if (appt.consultationRequestId) {
      await db
        .update(consultationRequests)
        .set({
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(consultationRequests.id, appt.consultationRequestId));
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "APPOINTMENT_CANCELLED",
      entityType: "appointments",
      entityId: appointmentId,
      details: { reason },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/staff");

    return { success: true };
  } catch (err: unknown) {
    console.error("[cancelStudentAppointmentAction] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel appointment.",
    };
  }
}
