"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, and, or, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  studentProfiles,
  virtualInternships,
  virtualInternshipEnrollments,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

export type VirtualInternshipItem = {
  id: string;
  title: string;
  slug: string;
  organizationName: string;
  department: string;
  level: string;
  duration: string;
  difficulty: string;
  bannerUrl: string | null;
  summary: string;
  description: string;
  learningObjectives: string[];
  tasksDeliverables: Array<{
    id: string;
    title: string;
    description: string;
    deliverableType: string;
  }>;
  skills: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  enrollmentsCount: number;
  completedCount: number;
};

export type EnrollmentTableRow = {
  id: string;
  internshipId: string;
  internshipTitle: string;
  organizationName: string;
  internshipDepartment?: string;
  internshipDifficulty?: string;
  internshipDuration?: string;
  internshipBannerUrl?: string | null;
  studentId: string;
  studentName: string;
  studentRegNumber: string;
  studentDepartment: string | null;
  studentLevel: string | null;
  studentAvatarUrl: string | null;
  status: "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";
  assignedByStaffName: string | null;
  assignmentNote: string | null;
  enrolledAt: Date;
  startedAt: Date | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedByStaffName: string | null;
  staffFeedback: string | null;
  gradeScore: string | null;
  outcomeType: "TEXT" | "URL" | "FILE" | "VIDEO" | "HYBRID" | null;
  outcomeTitle: string | null;
  outcomeText: string | null;
  outcomeUrl: string | null;
  outcomeFileUrl: string | null;
  outcomeFileName: string | null;
  outcomeMetadata: unknown;
};

export type CumulativeStudentOutcome = {
  studentId: string;
  studentName: string;
  regNumber: string;
  department: string | null;
  level: string | null;
  avatarUrl: string | null;
  totalEnrolled: number;
  totalApproved: number;
  totalPendingReview: number;
  totalInProgress: number;
  completedInternships: Array<{
    enrollmentId: string;
    internshipTitle: string;
    organizationName: string;
    duration: string;
    gradeScore: string | null;
    completedAt: Date | null;
    outcomeType: string;
    outcomeTitle: string | null;
    outcomeUrl: string | null;
    outcomeFileUrl: string | null;
    outcomeFileName: string | null;
    outcomeText: string | null;
  }>;
};

export type CreateInternshipInput = {
  title: string;
  organizationName: string;
  department?: string;
  level?: string;
  duration?: string;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  bannerUrl?: string;
  summary: string;
  description: string;
  learningObjectives?: string[];
  tasksDeliverables?: Array<{
    id: string;
    title: string;
    description: string;
    deliverableType: string;
  }>;
  skills?: string;
  isPublished?: boolean;
};

export type UpdateInternshipInput = Partial<CreateInternshipInput>;

export type SubmitOutcomeInput = {
  outcomeType: "TEXT" | "URL" | "FILE" | "VIDEO" | "HYBRID";
  outcomeTitle?: string;
  outcomeText?: string;
  outcomeUrl?: string;
  outcomeFileUrl?: string;
  outcomeFileName?: string;
  outcomeMetadata?: Record<string, unknown>;
};

export type ReviewEnrollmentInput = {
  status: "APPROVED" | "REVISION_REQUESTED";
  gradeScore?: string;
  staffFeedback: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * List all Virtual Internships with search & filters (Admin & Students)
 */
export async function listVirtualInternshipsAction(filter?: {
  search?: string;
  department?: string;
  level?: string;
  difficulty?: string;
  publishedOnly?: boolean;
}): Promise<VirtualInternshipItem[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized.");

  const conditions = [];

  if (filter?.publishedOnly ?? (currentUser.role === "STUDENT")) {
    conditions.push(eq(virtualInternships.isPublished, true));
  }
  if (filter?.department && filter.department !== "ALL") {
    conditions.push(
      or(
        eq(virtualInternships.department, filter.department),
        eq(virtualInternships.department, "ALL"),
      ),
    );
  }
  if (filter?.level && filter.level !== "ALL") {
    conditions.push(
      or(
        eq(virtualInternships.level, filter.level),
        eq(virtualInternships.level, "ALL"),
      ),
    );
  }
  if (filter?.difficulty && filter.difficulty !== "ALL") {
    conditions.push(eq(virtualInternships.difficulty, filter.difficulty));
  }
  if (filter?.search?.trim()) {
    const pattern = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(virtualInternships.title, pattern),
        ilike(virtualInternships.organizationName, pattern),
        ilike(virtualInternships.summary, pattern),
        ilike(virtualInternships.skills, pattern),
      ),
    );
  }

  const rows = await db
    .select()
    .from(virtualInternships)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(virtualInternships.createdAt));

  if (rows.length === 0) return [];

  const internshipIds = rows.map((r) => r.id);

  // Parallel counts for enrollments and completions
  const [enrollRows, completedRows] = await Promise.all([
    db
      .select({
        internshipId: virtualInternshipEnrollments.internshipId,
        count: sql<number>`count(*)::int`,
      })
      .from(virtualInternshipEnrollments)
      .where(inArray(virtualInternshipEnrollments.internshipId, internshipIds))
      .groupBy(virtualInternshipEnrollments.internshipId),
    db
      .select({
        internshipId: virtualInternshipEnrollments.internshipId,
        count: sql<number>`count(*)::int`,
      })
      .from(virtualInternshipEnrollments)
      .where(
        and(
          inArray(virtualInternshipEnrollments.internshipId, internshipIds),
          eq(virtualInternshipEnrollments.status, "APPROVED"),
        ),
      )
      .groupBy(virtualInternshipEnrollments.internshipId),
  ]);

  const enrollMap = new Map<string, number>();
  for (const r of enrollRows) enrollMap.set(r.internshipId, r.count);

  const completedMap = new Map<string, number>();
  for (const r of completedRows) completedMap.set(r.internshipId, r.count);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    organizationName: r.organizationName,
    department: r.department,
    level: r.level,
    duration: r.duration,
    difficulty: r.difficulty,
    bannerUrl: r.bannerUrl,
    summary: r.summary,
    description: r.description,
    learningObjectives: r.learningObjectives || [],
    tasksDeliverables: r.tasksDeliverables || [],
    skills: r.skills,
    isPublished: r.isPublished,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    enrollmentsCount: enrollMap.get(r.id) || 0,
    completedCount: completedMap.get(r.id) || 0,
  }));
}

/**
 * Super Admin & Staff: Create a new virtual internship simulation
 */
export async function createVirtualInternshipAction(
  input: CreateInternshipInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized to create virtual internships.");
    }

    if (!input.title?.trim() || !input.organizationName?.trim() || !input.summary?.trim()) {
      throw new Error("Title, Organization Name, and Summary are required.");
    }

    let baseSlug = slugify(input.title);
    if (!baseSlug) baseSlug = `internship-${Date.now()}`;

    // Ensure slug uniqueness
    const existing = await db
      .select({ id: virtualInternships.id })
      .from(virtualInternships)
      .where(eq(virtualInternships.slug, baseSlug))
      .limit(1);

    const finalSlug = existing.length > 0 ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const [inserted] = await db
      .insert(virtualInternships)
      .values({
        title: input.title.trim(),
        slug: finalSlug,
        organizationName: input.organizationName.trim(),
        department: input.department || "ALL",
        level: input.level || "ALL",
        duration: input.duration?.trim() || "4 Weeks",
        difficulty: input.difficulty || "INTERMEDIATE",
        bannerUrl: input.bannerUrl?.trim() || null,
        summary: input.summary.trim(),
        description: input.description?.trim() || input.summary.trim(),
        learningObjectives: input.learningObjectives || [],
        tasksDeliverables: input.tasksDeliverables || [],
        skills: input.skills?.trim() || null,
        isPublished: input.isPublished ?? true,
      })
      .returning({ id: virtualInternships.id });

    await recordAuditLog({
      actorId: currentUser.id,
      action: "VIRTUAL_INTERNSHIP_CREATE",
      entityType: "virtual_internships",
      entityId: inserted.id,
      details: { title: input.title, organization: input.organizationName },
    });

    revalidatePath("/admin");
    return { success: true, id: inserted.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create virtual internship.",
    };
  }
}

/**
 * Super Admin & Staff: Update an existing virtual internship
 */
export async function updateVirtualInternshipAction(
  id: string,
  input: UpdateInternshipInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    const patch: Partial<typeof virtualInternships.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.organizationName !== undefined) patch.organizationName = input.organizationName.trim();
    if (input.department !== undefined) patch.department = input.department;
    if (input.level !== undefined) patch.level = input.level;
    if (input.duration !== undefined) patch.duration = input.duration.trim();
    if (input.difficulty !== undefined) patch.difficulty = input.difficulty;
    if (input.bannerUrl !== undefined) patch.bannerUrl = input.bannerUrl?.trim() || null;
    if (input.summary !== undefined) patch.summary = input.summary.trim();
    if (input.description !== undefined) patch.description = input.description.trim();
    if (input.learningObjectives !== undefined) patch.learningObjectives = input.learningObjectives;
    if (input.tasksDeliverables !== undefined) patch.tasksDeliverables = input.tasksDeliverables;
    if (input.skills !== undefined) patch.skills = input.skills?.trim() || null;
    if (input.isPublished !== undefined) patch.isPublished = input.isPublished;

    await db
      .update(virtualInternships)
      .set(patch)
      .where(eq(virtualInternships.id, id));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "VIRTUAL_INTERNSHIP_UPDATE",
      entityType: "virtual_internships",
      entityId: id,
      details: patch,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update virtual internship.",
    };
  }
}

/**
 * Super Admin & Staff: Delete virtual internship
 */
export async function deleteVirtualInternshipAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    await db.delete(virtualInternships).where(eq(virtualInternships.id, id));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "VIRTUAL_INTERNSHIP_DELETE",
      entityType: "virtual_internships",
      entityId: id,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete virtual internship.",
    };
  }
}

/**
 * Super Admin & Staff: Assign virtual internship to one or more students
 */
export async function assignVirtualInternshipAction(input: {
  internshipId: string;
  studentIds: string[];
  assignmentNote?: string;
}): Promise<{ success: boolean; assignedCount: number; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized to assign virtual internships.");
    }

    if (!input.internshipId || !input.studentIds?.length) {
      throw new Error("Internship and at least one student required.");
    }

    let assignedCount = 0;

    for (const studentId of input.studentIds) {
      // Upsert enrollment or keep existing if completed
      const [existing] = await db
        .select({ id: virtualInternshipEnrollments.id, status: virtualInternshipEnrollments.status })
        .from(virtualInternshipEnrollments)
        .where(
          and(
            eq(virtualInternshipEnrollments.internshipId, input.internshipId),
            eq(virtualInternshipEnrollments.studentId, studentId),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(virtualInternshipEnrollments).values({
          internshipId: input.internshipId,
          studentId,
          assignedByUserId: currentUser.id,
          assignmentNote: input.assignmentNote?.trim() || null,
          status: "ASSIGNED",
        });
        assignedCount++;
      } else if (existing.status === "ASSIGNED" || existing.status === "REVISION_REQUESTED") {
        await db
          .update(virtualInternshipEnrollments)
          .set({
            assignedByUserId: currentUser.id,
            assignmentNote: input.assignmentNote?.trim() || null,
            updatedAt: new Date(),
          })
          .where(eq(virtualInternshipEnrollments.id, existing.id));
        assignedCount++;
      }
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "VIRTUAL_INTERNSHIP_ASSIGN",
      entityType: "virtual_internship_enrollments",
      entityId: input.internshipId,
      details: { count: assignedCount, studentIds: input.studentIds },
    });

    revalidatePath("/admin");
    return { success: true, assignedCount };
  } catch (err: unknown) {
    return {
      success: false,
      assignedCount: 0,
      error: err instanceof Error ? err.message : "Failed to assign virtual internship.",
    };
  }
}

/**
 * Student: Self-enroll / take a published virtual internship
 */
export async function enrollVirtualInternshipAction(
  internshipId: string,
): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.studentProfile) {
      throw new Error("Student authentication required to take virtual internship.");
    }

    const studentId = currentUser.studentProfile.id;

    const [existing] = await db
      .select({ id: virtualInternshipEnrollments.id, status: virtualInternshipEnrollments.status })
      .from(virtualInternshipEnrollments)
      .where(
        and(
          eq(virtualInternshipEnrollments.internshipId, internshipId),
          eq(virtualInternshipEnrollments.studentId, studentId),
        ),
      )
      .limit(1);

    if (existing) {
      if (existing.status === "ASSIGNED") {
        await db
          .update(virtualInternshipEnrollments)
          .set({
            status: "IN_PROGRESS",
            startedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(virtualInternshipEnrollments.id, existing.id));
      }
      return { success: true, enrollmentId: existing.id };
    }

    const [inserted] = await db
      .insert(virtualInternshipEnrollments)
      .values({
        internshipId,
        studentId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      })
      .returning({ id: virtualInternshipEnrollments.id });

    revalidatePath("/dashboard");
    return { success: true, enrollmentId: inserted.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to enroll in virtual internship.",
    };
  }
}

/**
 * Student: Submit polymorphic outcome for an internship card
 * Supports: Text reflection, Live URL (GitHub, web, Loom, YouTube), Document/File/Image
 */
export async function submitInternshipOutcomeAction(
  enrollmentId: string,
  input: SubmitOutcomeInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized.");

    const [enrollment] = await db
      .select()
      .from(virtualInternshipEnrollments)
      .where(eq(virtualInternshipEnrollments.id, enrollmentId))
      .limit(1);

    if (!enrollment) throw new Error("Enrollment not found.");

    // Permission: Student can only submit their own
    if (
      currentUser.role === "STUDENT" &&
      currentUser.studentProfile?.id !== enrollment.studentId
    ) {
      throw new Error("Access denied.");
    }

    await db
      .update(virtualInternshipEnrollments)
      .set({
        status: "SUBMITTED",
        outcomeType: input.outcomeType,
        outcomeTitle: input.outcomeTitle?.trim() || "Virtual Internship Deliverables",
        outcomeText: input.outcomeText?.trim() || null,
        outcomeUrl: input.outcomeUrl?.trim() || null,
        outcomeFileUrl: input.outcomeFileUrl?.trim() || null,
        outcomeFileName: input.outcomeFileName?.trim() || null,
        outcomeMetadata: input.outcomeMetadata || null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(virtualInternshipEnrollments.id, enrollmentId));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "VIRTUAL_INTERNSHIP_SUBMIT_OUTCOME",
      entityType: "virtual_internship_enrollments",
      entityId: enrollmentId,
      details: { outcomeType: input.outcomeType, outcomeUrl: input.outcomeUrl },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to submit internship outcome.",
    };
  }
}

/**
 * Career Staff & Super Admin: Review, approve or request revision on student submission
 */
export async function reviewInternshipSubmissionAction(
  enrollmentId: string,
  input: ReviewEnrollmentInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized to review virtual internships.");
    }

    await db
      .update(virtualInternshipEnrollments)
      .set({
        status: input.status,
        gradeScore: input.gradeScore?.trim() || (input.status === "APPROVED" ? "Completed" : null),
        staffFeedback: input.staffFeedback.trim(),
        reviewedAt: new Date(),
        reviewedByUserId: currentUser.id,
        updatedAt: new Date(),
      })
      .where(eq(virtualInternshipEnrollments.id, enrollmentId));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "VIRTUAL_INTERNSHIP_REVIEW",
      entityType: "virtual_internship_enrollments",
      entityId: enrollmentId,
      details: { status: input.status, grade: input.gradeScore },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to review internship submission.",
    };
  }
}

/**
 * List all enrollments & submissions with joined student & internship info
 */
export async function listInternshipEnrollmentsAction(filter?: {
  internshipId?: string;
  studentId?: string;
  status?: string;
  search?: string;
}): Promise<EnrollmentTableRow[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized.");

  const conditions = [];

  if (filter?.internshipId && filter.internshipId !== "ALL") {
    conditions.push(eq(virtualInternshipEnrollments.internshipId, filter.internshipId));
  }
  if (filter?.studentId) {
    conditions.push(eq(virtualInternshipEnrollments.studentId, filter.studentId));
  } else if (currentUser.role === "STUDENT" && currentUser.studentProfile) {
    conditions.push(eq(virtualInternshipEnrollments.studentId, currentUser.studentProfile.id));
  }
  if (filter?.status && filter.status !== "ALL") {
    conditions.push(eq(virtualInternshipEnrollments.status, filter.status as never));
  }
  if (filter?.search?.trim()) {
    const pattern = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(studentProfiles.fullName, pattern),
        ilike(studentProfiles.regNumber, pattern),
        ilike(virtualInternships.title, pattern),
        ilike(virtualInternships.organizationName, pattern),
      ),
    );
  }

  const rows = await db
    .select({
      id: virtualInternshipEnrollments.id,
      internshipId: virtualInternshipEnrollments.internshipId,
      internshipTitle: virtualInternships.title,
      organizationName: virtualInternships.organizationName,
      internshipDepartment: virtualInternships.department,
      internshipDifficulty: virtualInternships.difficulty,
      internshipDuration: virtualInternships.duration,
      internshipBannerUrl: virtualInternships.bannerUrl,
      studentId: virtualInternshipEnrollments.studentId,
      studentName: studentProfiles.fullName,
      studentRegNumber: studentProfiles.regNumber,
      studentDepartment: studentProfiles.department,
      studentLevel: studentProfiles.level,
      studentAvatarUrl: studentProfiles.avatarUrl,
      status: virtualInternshipEnrollments.status,
      assignedByUserId: virtualInternshipEnrollments.assignedByUserId,
      assignmentNote: virtualInternshipEnrollments.assignmentNote,
      enrolledAt: virtualInternshipEnrollments.enrolledAt,
      startedAt: virtualInternshipEnrollments.startedAt,
      submittedAt: virtualInternshipEnrollments.submittedAt,
      reviewedAt: virtualInternshipEnrollments.reviewedAt,
      reviewedByUserId: virtualInternshipEnrollments.reviewedByUserId,
      staffFeedback: virtualInternshipEnrollments.staffFeedback,
      gradeScore: virtualInternshipEnrollments.gradeScore,
      outcomeType: virtualInternshipEnrollments.outcomeType,
      outcomeTitle: virtualInternshipEnrollments.outcomeTitle,
      outcomeText: virtualInternshipEnrollments.outcomeText,
      outcomeUrl: virtualInternshipEnrollments.outcomeUrl,
      outcomeFileUrl: virtualInternshipEnrollments.outcomeFileUrl,
      outcomeFileName: virtualInternshipEnrollments.outcomeFileName,
      outcomeMetadata: virtualInternshipEnrollments.outcomeMetadata,
    })
    .from(virtualInternshipEnrollments)
    .innerJoin(
      virtualInternships,
      eq(virtualInternshipEnrollments.internshipId, virtualInternships.id),
    )
    .innerJoin(
      studentProfiles,
      eq(virtualInternshipEnrollments.studentId, studentProfiles.id),
    )
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(virtualInternshipEnrollments.updatedAt));

  return rows.map((r) => ({
    id: r.id,
    internshipId: r.internshipId,
    internshipTitle: r.internshipTitle,
    organizationName: r.organizationName,
    internshipDepartment: r.internshipDepartment,
    internshipDifficulty: r.internshipDifficulty,
    internshipDuration: r.internshipDuration,
    internshipBannerUrl: r.internshipBannerUrl,
    studentId: r.studentId,
    studentName: r.studentName,
    studentRegNumber: r.studentRegNumber,
    studentDepartment: r.studentDepartment,
    studentLevel: r.studentLevel,
    studentAvatarUrl: r.studentAvatarUrl,
    status: r.status as EnrollmentTableRow["status"],
    assignedByStaffName: r.assignedByUserId ? "Career Officer" : null,
    assignmentNote: r.assignmentNote,
    enrolledAt: r.enrolledAt,
    startedAt: r.startedAt,
    submittedAt: r.submittedAt,
    reviewedAt: r.reviewedAt,
    reviewedByStaffName: r.reviewedByUserId ? "Career Advisory Staff" : null,
    staffFeedback: r.staffFeedback,
    gradeScore: r.gradeScore,
    outcomeType: r.outcomeType as EnrollmentTableRow["outcomeType"],
    outcomeTitle: r.outcomeTitle,
    outcomeText: r.outcomeText,
    outcomeUrl: r.outcomeUrl,
    outcomeFileUrl: r.outcomeFileUrl,
    outcomeFileName: r.outcomeFileName,
    outcomeMetadata: r.outcomeMetadata,
  }));
}

/**
 * Super Admin & Staff: Cumulative outcomes submitted by students based on each internship taken
 */
export async function getCumulativeStudentOutcomesAction(filter?: {
  search?: string;
  department?: string;
}): Promise<CumulativeStudentOutcome[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    throw new Error("Unauthorized.");
  }

  const enrollments = await listInternshipEnrollmentsAction({
    search: filter?.search,
  });

  // Group by studentId
  const studentMap = new Map<string, CumulativeStudentOutcome>();

  for (const e of enrollments) {
    if (filter?.department && filter.department !== "ALL" && e.studentDepartment !== filter.department) {
      continue;
    }

    if (!studentMap.has(e.studentId)) {
      studentMap.set(e.studentId, {
        studentId: e.studentId,
        studentName: e.studentName,
        regNumber: e.studentRegNumber,
        department: e.studentDepartment,
        level: e.studentLevel,
        avatarUrl: e.studentAvatarUrl,
        totalEnrolled: 0,
        totalApproved: 0,
        totalPendingReview: 0,
        totalInProgress: 0,
        completedInternships: [],
      });
    }

    const current = studentMap.get(e.studentId)!;
    current.totalEnrolled++;

    if (e.status === "APPROVED") {
      current.totalApproved++;
      current.completedInternships.push({
        enrollmentId: e.id,
        internshipTitle: e.internshipTitle,
        organizationName: e.organizationName,
        duration: "Completed",
        gradeScore: e.gradeScore,
        completedAt: e.reviewedAt || e.submittedAt,
        outcomeType: e.outcomeType || "HYBRID",
        outcomeTitle: e.outcomeTitle,
        outcomeUrl: e.outcomeUrl,
        outcomeFileUrl: e.outcomeFileUrl,
        outcomeFileName: e.outcomeFileName,
        outcomeText: e.outcomeText,
      });
    } else if (e.status === "SUBMITTED") {
      current.totalPendingReview++;
    } else if (e.status === "IN_PROGRESS" || e.status === "ASSIGNED") {
      current.totalInProgress++;
    }
  }

  return Array.from(studentMap.values()).sort(
    (a, b) => b.totalApproved - a.totalApproved || b.totalEnrolled - a.totalEnrolled,
  );
}

/**
 * Seed 5 standard, industry-grade Virtual Work Simulations for KSITM Students
 */
export async function seedStandardVirtualInternshipsAction(): Promise<{
  success: boolean;
  seededCount: number;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      throw new Error("Super Admin authorization required.");
    }

    const samples: CreateInternshipInput[] = [
      {
        title: "Cloud Infrastructure & Full-Stack Web Engineering Simulation",
        organizationName: "Google Cloud & Forage",
        department: "Computer Science",
        level: "ALL",
        duration: "4 Weeks (15 Hours Self-Paced)",
        difficulty: "INTERMEDIATE",
        bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
        summary:
          "Practical simulation modeling modern cloud services, RESTful API design, database indexing, and automated CI/CD container deployment on Google Cloud Run.",
        description:
          "Step into the role of an Associate Cloud Solutions Engineer. You will refactor a monolithic legacy web application into scalable cloud microservices, implement Google Cloud SQL database migration, configure role-based authentication, and optimize latency across distributed nodes.",
        learningObjectives: [
          "Architect containerized web microservices using Docker and Docker Compose.",
          "Design robust PostgreSQL schema indices and foreign key constraint validations.",
          "Configure automated GitHub Actions CI/CD workflows for multi-branch environments.",
          "Conduct synthetic HTTP load testing and analyze latency bottlenecks using Prometheus metrics.",
        ],
        tasksDeliverables: [
          {
            id: "TASK-1",
            title: "Task 1: Architecture Blueprint & Cloud Schema Design",
            description: "Draft an ER diagram and PostgreSQL DDL migration script for a multi-tenant client system.",
            deliverableType: "Document / Architecture Diagram",
          },
          {
            id: "TASK-2",
            title: "Task 2: RESTful Microservice Implementation",
            description: "Develop 4 secured API endpoints with input sanitation, error handling, and JWT authentication.",
            deliverableType: "GitHub Repository / Live API URL",
          },
          {
            id: "TASK-3",
            title: "Task 3: Production Deployment & Video Walkthrough",
            description: "Deploy the service to a cloud provider and record a 3-minute Loom video demo explaining performance benchmarks.",
            deliverableType: "Video Presentation / Live Deployment Link",
          },
        ],
        skills: "Google Cloud, Docker, TypeScript, PostgreSQL, CI/CD, REST APIs",
        isPublished: true,
      },
      {
        title: "Northern Nigeria AgriTech Market Information Systems Internship",
        organizationName: "Katsina Tech Hub & Innovation Labs",
        department: "ALL",
        level: "ALL",
        duration: "3 Weeks (12 Hours)",
        difficulty: "BEGINNER",
        bannerUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1200&auto=format&fit=crop&q=80",
        summary:
          "Design and test a localized agricultural commodity pricing dashboard connecting Katsina grain markets with real-time SMS and web updates.",
        description:
          "Work with the Katsina Tech Hub incubation team to build software solving real regional problems. You will analyze market price data from Dandume, Funtua, and Charanchi grain exchanges, build an intuitive mobile-friendly portal, and design an offline-first caching layer for rural farmers.",
        learningObjectives: [
          "Collect, clean, and normalize agricultural price feeds from informal retail markets.",
          "Construct responsive, high-contrast mobile dashboards tailored for low-bandwidth 3G devices.",
          "Implement PWA offline caching with Service Workers and IndexedDB.",
          "Write clear Hausa/English localized user documentation for community agricultural extension officers.",
        ],
        tasksDeliverables: [
          {
            id: "TASK-1",
            title: "Task 1: Market Data Schema & ETL Script",
            description: "Write a script normalizing weekly commodity prices for maize, sorghum, and cowpeas.",
            deliverableType: "Python / SQL Script or Document",
          },
          {
            id: "TASK-2",
            title: "Task 2: Responsive Farmer Dashboard Portal",
            description: "Build an accessible web UI allowing farmers to compare prices across Katsina state markets.",
            deliverableType: "GitHub Repository / Live Web Link",
          },
        ],
        skills: "JavaScript, HTML5, Offline PWA, Data Analytics, UI/UX, Localized Tech",
        isPublished: true,
      },
      {
        title: "Enterprise Cybersecurity Threat Detection & Perimeter Hardening",
        organizationName: "Microsoft Africa Development Centre (ADC)",
        department: "Networking & System Security",
        level: "ALL",
        duration: "5 Weeks (20 Hours)",
        difficulty: "ADVANCED",
        bannerUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80",
        summary:
          "Simulated SOC (Security Operations Center) defense: analyze Wireshark packet captures, configure pfSense firewall rules, and remediate mock ransomware threats.",
        description:
          "Step into a simulated Security Operations Center environment. You will inspect anomalous network telemetry, detect suspicious lateral movement, configure Snort IDS rules, and draft an executive incident response brief adhering to NIST cybersecurity standards.",
        learningObjectives: [
          "Perform deep packet inspection on pcap traces identifying port scan reconnaissance.",
          "Author custom Snort IDS signatures detecting malicious reverse shell payloads.",
          "Configure restrictive firewall rules and VLAN segmentation for sensitive subnet hosts.",
          "Draft an executive incident post-mortem report and risk remediation timeline.",
        ],
        tasksDeliverables: [
          {
            id: "TASK-1",
            title: "Task 1: Packet Capture Forensics & Attack Analysis",
            description: "Analyze an incident pcap file, extract attacker IP addresses, and identify compromised ports.",
            deliverableType: "Forensics Report (PDF / Markdown)",
          },
          {
            id: "TASK-2",
            title: "Task 2: Firewall Hardening & Remediation Blueprint",
            description: "Formulate updated iptables/pfSense rule tables to block lateral movement across enterprise subnets.",
            deliverableType: "Configuration File / Documentation",
          },
        ],
        skills: "Wireshark, pfSense, Network Security, NIST Framework, Packet Analysis",
        isPublished: true,
      },
      {
        title: "FinTech Digital Ledger & Payment Gateway Integration Simulation",
        organizationName: "Paystack & Flutterwave Academy",
        department: "Banking Operations & FinTech",
        level: "ALL",
        duration: "4 Weeks (16 Hours)",
        difficulty: "INTERMEDIATE",
        bannerUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80",
        summary:
          "Build an end-to-end digital transaction checkout flow with statutory KYC validation, double-entry ledger bookkeeping, and webhook verification.",
        description:
          "Simulate engineering a financial technology product for Nigerian SMEs. You will integrate payment webhooks, handle network dropouts gracefully with idempotent requests, implement statutory AML check guidelines, and generate automated reconciliation ledgers.",
        learningObjectives: [
          "Implement double-entry bookkeeping accounting ledgers in relational SQL databases.",
          "Verify payment webhook cryptographic signatures preventing replay attacks.",
          "Handle payment race conditions and concurrency with database transactions and row locks.",
          "Produce automated transaction settlement reconciliation reports in CSV and PDF formats.",
        ],
        tasksDeliverables: [
          {
            id: "TASK-1",
            title: "Task 1: Double-Entry Ledger Schema & Concurrency Test",
            description: "Create an immutable ledger table with debit and credit balance invariant checks.",
            deliverableType: "SQL Schema & Test Script",
          },
          {
            id: "TASK-2",
            title: "Task 2: End-to-End Checkout Demo & Documentation",
            description: "Deploy a mock payment checkout web app demonstrating successful and failed webhook verification.",
            deliverableType: "Live Web Link / Video Demo Link",
          },
        ],
        skills: "FinTech, Webhooks, SQL Ledger, Double-Entry Bookkeeping, Node.js",
        isPublished: true,
      },
      {
        title: "Public Sector e-Government Data Systems & Open API Project",
        organizationName: "NITDA — National Information Technology Development Agency",
        department: "ALL",
        level: "ALL",
        duration: "3 Weeks (10 Hours)",
        difficulty: "BEGINNER",
        bannerUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
        summary:
          "Construct secure public sector citizen service APIs adhering to National e-Government Interoperability Framework (NeGIF) standards.",
        description:
          "Collaborate on a government digital transformation simulation. You will build open data services allowing citizens to query public transport schedules, verify institutional certificates, and submit digitized service requests with audit logs.",
        learningObjectives: [
          "Understand statutory data privacy regulations under the Nigeria Data Protection Act (NDPA).",
          "Design REST APIs following NeGIF e-government interoperability specifications.",
          "Implement automated rate limiting, API key quotas, and role-based access control.",
          "Publish interactive Swagger/OpenAPI documentation for cross-agency integrations.",
        ],
        tasksDeliverables: [
          {
            id: "TASK-1",
            title: "Task 1: OpenAPI 3.0 Specification & Swagger UI",
            description: "Publish interactive API documentation describing 5 public sector citizen endpoints.",
            deliverableType: "OpenAPI YAML / Swagger Link",
          },
          {
            id: "TASK-2",
            title: "Task 2: API Prototype & NDPA Privacy Audit",
            description: "Develop working API with data pseudonymization adhering to NDPA regulations.",
            deliverableType: "GitHub Repository / Live API Demo",
          },
        ],
        skills: "OpenAPI, REST, NDPA Privacy, Government IT, Security, API Gateway",
        isPublished: true,
      },
    ];

    let seededCount = 0;

    for (const s of samples) {
      const res = await createVirtualInternshipAction(s);
      if (res.success) seededCount++;
    }

    // Also seed a couple of sample student submissions so Cumulative Outcomes immediately shows rich data
    const students = await db
      .select({ id: studentProfiles.id, fullName: studentProfiles.fullName })
      .from(studentProfiles)
      .limit(3);

    const internships = await db
      .select({ id: virtualInternships.id, title: virtualInternships.title })
      .from(virtualInternships)
      .limit(2);

    if (students.length > 0 && internships.length > 0) {
      // Enroll student 1 and mark approved
      const [e1] = await db
        .insert(virtualInternshipEnrollments)
        .values({
          internshipId: internships[0].id,
          studentId: students[0].id,
          assignedByUserId: currentUser.id,
          assignmentNote: "Recommended to complete before your final term project.",
          status: "APPROVED",
          startedAt: new Date(Date.now() - 14 * 86400000),
          submittedAt: new Date(Date.now() - 3 * 86400000),
          reviewedAt: new Date(Date.now() - 1 * 86400000),
          reviewedByUserId: currentUser.id,
          staffFeedback: "Exemplary execution. Clean microservice architecture, comprehensive test coverage, and clear Loom video explanation.",
          gradeScore: "Distinction (96%)",
          outcomeType: "HYBRID",
          outcomeTitle: "Cloud Run Microservices & Benchmarking Suite",
          outcomeText: "Successfully decomposed the monolithic backend into 3 Docker microservices. Added Redis caching which lowered peak response time from 380ms down to 42ms. Prepared full OpenAPI docs.",
          outcomeUrl: "https://github.com/ksitm-student/cloud-run-simulation",
          outcomeFileUrl: "https://docs.google.com/presentation/d/e/2PACX-sample/pub",
          outcomeFileName: "Architecture_Technical_Report.pdf",
        })
        .onConflictDoNothing()
        .returning({ id: virtualInternshipEnrollments.id });

      if (e1 && students.length > 1) {
        // Enroll student 2 and mark submitted (pending review)
        await db
          .insert(virtualInternshipEnrollments)
          .values({
            internshipId: internships[0].id,
            studentId: students[1].id,
            status: "SUBMITTED",
            startedAt: new Date(Date.now() - 10 * 86400000),
            submittedAt: new Date(Date.now() - 1 * 86400000),
            outcomeType: "URL",
            outcomeTitle: "Automated Container Pipeline & Deployment",
            outcomeText: "Implemented GitHub Actions workflow and configured Google Cloud Secret Manager for credentials storage.",
            outcomeUrl: "https://github.com/ksitm-student/ci-cd-pipeline",
          })
          .onConflictDoNothing();
      }
    }

    revalidatePath("/admin");
    return { success: true, seededCount };
  } catch (err: unknown) {
    return {
      success: false,
      seededCount: 0,
      error: err instanceof Error ? err.message : "Failed to seed virtual internships.",
    };
  }
}

export type StudentPortfolioData = {
  totalEnrolled: number;
  totalApproved: number;
  totalSubmitted: number;
  averageScore: number | null;
  enrollments: EnrollmentTableRow[];
};

/**
 * Student: Get personal cumulative internship portfolio and outcomes
 */
export async function getMyInternshipPortfolioAction(): Promise<{
  success: boolean;
  data?: StudentPortfolioData;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.studentProfile) {
      throw new Error("Student authentication required.");
    }

    const enrollments = await listInternshipEnrollmentsAction({
      studentId: currentUser.studentProfile.id,
    });

    const approvedList = enrollments.filter(
      (e) => e.status === "APPROVED" && e.gradeScore !== null,
    );
    const averageScore =
      approvedList.length > 0
        ? Math.round(
            approvedList.reduce(
              (acc, curr) => acc + (Number(curr.gradeScore) || 0),
              0,
            ) / approvedList.length,
          )
        : null;

    return {
      success: true,
      data: {
        totalEnrolled: enrollments.length,
        totalApproved: enrollments.filter((e) => e.status === "APPROVED").length,
        totalSubmitted: enrollments.filter((e) => e.status === "SUBMITTED").length,
        averageScore,
        enrollments,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to load student portfolio.",
    };
  }
}

