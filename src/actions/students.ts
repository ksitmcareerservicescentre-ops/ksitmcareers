"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, and, sql, or, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  studentProfiles,
  studentMasterList,
  studentOccurrences,
  assessmentAttempts,
  assessments,
  moduleAssignments,
  studentServiceEntitlements,
  appointments,
  staffProfiles,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { recordAuditLog } from "@/lib/audit";

export type StudentTableRow = {
  id: string; // studentProfiles.id
  userId: string;
  fullName: string;
  regNumber: string;
  department: string | null;
  level: string | null;
  phone: string | null;
  email: string;
  isActive: boolean;
  avatarUrl: string | null;
  bio: string | null;
  linkedInUrl: string | null;
  assessmentsCount: number;
  occurrencesCount: number;
  createdAt: Date;
};

export type StudentDossierData = {
  profile: {
    id: string;
    userId: string;
    fullName: string;
    regNumber: string;
    department: string | null;
    level: string | null;
    phone: string | null;
    email: string;
    isActive: boolean;
    bio: string | null;
    avatarUrl: string | null;
    linkedInUrl: string | null;
    createdAt: Date;
  };
  metrics: {
    totalAssessments: number;
    passedAssessments: number;
    averageScore: number;
    completedModules: number;
    activeEntitlements: number;
    totalOccurrences: number;
  };
  assessments: Array<{
    attemptId: string;
    assessmentTitle: string;
    category: string;
    score: number | null;
    passingScore: number;
    passed: boolean;
    status: string;
    completedAt: Date | null;
  }>;
  modules: Array<{
    id: string;
    title: string;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
  }>;
  occurrences: Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    actionTaken: string | null;
    actorName: string;
    occurrenceDate: Date;
  }>;
  appointments: Array<{
    id: string;
    status: string;
    scheduledStart: Date;
    staffName: string;
    meetingLocation: string;
  }>;
};

/**
 * Super Admin & Staff: List students with filters & pagination
 */
export async function listStudentsAction(filter?: {
  search?: string;
  department?: string;
  level?: string;
  status?: string;
}): Promise<StudentTableRow[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    throw new Error("Unauthorized access to student directory.");
  }

  const conditions = [];
  const search = filter?.search?.trim();
  const dept = filter?.department;
  const lvl = filter?.level;
  const status = filter?.status;

  if (dept && dept !== "ALL") {
    conditions.push(eq(studentProfiles.department, dept));
  }
  if (lvl && lvl !== "ALL") {
    conditions.push(eq(studentProfiles.level, lvl));
  }
  if (status && status !== "ALL") {
    conditions.push(eq(users.isActive, status === "ACTIVE"));
  }
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(studentProfiles.fullName, pattern),
        ilike(studentProfiles.regNumber, pattern),
        ilike(users.email, pattern),
      ),
    );
  }

  const students = await db
    .select({
      id: studentProfiles.id,
      userId: studentProfiles.userId,
      fullName: studentProfiles.fullName,
      regNumber: studentProfiles.regNumber,
      department: studentProfiles.department,
      level: studentProfiles.level,
      phone: studentProfiles.phone,
      bio: studentProfiles.bio,
      avatarUrl: studentProfiles.avatarUrl,
      linkedInUrl: studentProfiles.linkedInUrl,
      createdAt: studentProfiles.createdAt,
      email: users.email,
      isActive: users.isActive,
    })
    .from(studentProfiles)
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(studentProfiles.createdAt));

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((s) => s.id);

  // Parallel batch queries for counts — completely eliminates serial N+1 database roundtrips
  const [attRows, occRows] = await Promise.all([
    db
      .select({
        studentId: assessmentAttempts.studentId,
        count: sql<number>`count(*)::int`,
      })
      .from(assessmentAttempts)
      .where(inArray(assessmentAttempts.studentId, studentIds))
      .groupBy(assessmentAttempts.studentId),
    db
      .select({
        studentId: studentOccurrences.studentId,
        count: sql<number>`count(*)::int`,
      })
      .from(studentOccurrences)
      .where(inArray(studentOccurrences.studentId, studentIds))
      .groupBy(studentOccurrences.studentId),
  ]);

  const attMap = new Map<string, number>();
  for (const row of attRows) {
    if (row.studentId) attMap.set(row.studentId, row.count);
  }

  const occMap = new Map<string, number>();
  for (const row of occRows) {
    if (row.studentId) occMap.set(row.studentId, row.count);
  }

  return students.map((st) => ({
    ...st,
    assessmentsCount: attMap.get(st.id) || 0,
    occurrencesCount: occMap.get(st.id) || 0,
  }));
}

/**
 * Super Admin & Staff: Fetch full Student Academic Dossier & Records
 */
export async function getStudentDossierAction(studentId: string): Promise<StudentDossierData | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    throw new Error("Unauthorized.");
  }

  const [student] = await db
    .select({
      id: studentProfiles.id,
      userId: studentProfiles.userId,
      fullName: studentProfiles.fullName,
      regNumber: studentProfiles.regNumber,
      department: studentProfiles.department,
      level: studentProfiles.level,
      phone: studentProfiles.phone,
      bio: studentProfiles.bio,
      avatarUrl: studentProfiles.avatarUrl,
      linkedInUrl: studentProfiles.linkedInUrl,
      createdAt: studentProfiles.createdAt,
      email: users.email,
      isActive: users.isActive,
    })
    .from(studentProfiles)
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(eq(studentProfiles.id, studentId))
    .limit(1);

  if (!student) return null;

  // 1. Assessments
  const attempts = await db
    .select({
      attemptId: assessmentAttempts.id,
      assessmentTitle: assessments.title,
      category: assessments.category,
      score: assessmentAttempts.score,
      passingScore: assessments.passingScore,
      status: assessmentAttempts.status,
      completedAt: assessmentAttempts.completedAt,
    })
    .from(assessmentAttempts)
    .innerJoin(assessments, eq(assessmentAttempts.assessmentId, assessments.id))
    .where(eq(assessmentAttempts.studentId, studentId))
    .orderBy(desc(assessmentAttempts.createdAt));

  const evaluatedAttempts = attempts.filter((a) => a.score !== null);
  const passedAttempts = evaluatedAttempts.filter((a) => (a.score || 0) >= a.passingScore);
  const avgScore =
    evaluatedAttempts.length > 0
      ? Math.round(evaluatedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / evaluatedAttempts.length)
      : 0;

  // 2. Modules
  const modules = await db
    .select({
      id: moduleAssignments.id,
      title: moduleAssignments.title,
      status: moduleAssignments.status,
      startedAt: moduleAssignments.startedAt,
      completedAt: moduleAssignments.completedAt,
    })
    .from(moduleAssignments)
    .where(eq(moduleAssignments.studentId, studentId))
    .orderBy(desc(moduleAssignments.assignedAt));

  const completedModulesCount = modules.filter((m) => m.status === "COMPLETED").length;

  // 3. Occurrences & Milestones
  const occurrences = await db
    .select({
      id: studentOccurrences.id,
      category: studentOccurrences.category,
      title: studentOccurrences.title,
      description: studentOccurrences.description,
      actionTaken: studentOccurrences.actionTaken,
      actorName: studentOccurrences.actorName,
      occurrenceDate: studentOccurrences.occurrenceDate,
    })
    .from(studentOccurrences)
    .where(eq(studentOccurrences.studentId, studentId))
    .orderBy(desc(studentOccurrences.occurrenceDate));

  // 4. Appointments
  const appts = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      scheduledStart: appointments.scheduledStart,
      staffName: staffProfiles.fullName,
      meetingLocation: appointments.meetingLocation,
    })
    .from(appointments)
    .leftJoin(staffProfiles, eq(appointments.staffId, staffProfiles.id))
    .where(eq(appointments.studentId, studentId))
    .orderBy(desc(appointments.scheduledStart));

  // 5. Active Entitlements count
  const [entitlementsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studentServiceEntitlements)
    .where(and(eq(studentServiceEntitlements.studentId, studentId), eq(studentServiceEntitlements.status, "ACTIVE")));

  return {
    profile: student,
    metrics: {
      totalAssessments: attempts.length,
      passedAssessments: passedAttempts.length,
      averageScore: avgScore,
      completedModules: completedModulesCount,
      activeEntitlements: entitlementsCount?.count || 0,
      totalOccurrences: occurrences.length,
    },
    assessments: attempts.map((a) => ({
      ...a,
      passed: a.score !== null ? a.score >= a.passingScore : false,
    })),
    modules,
    occurrences,
    appointments: appts.map((ap) => ({
      ...ap,
      staffName: ap.staffName || "Unassigned Officer",
    })),
  };
}

/**
 * Super Admin: Create a new student account
 */
export async function createStudentAction(data: {
  fullName: string;
  regNumber: string;
  email: string;
  department: string;
  level: string;
  phone?: string;
  password?: string;
  avatarUrl?: string;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return { success: false, error: "Super Admin privileges required." };
  }

  const fullName = data.fullName?.trim();
  const regNumber = data.regNumber?.trim().toUpperCase();
  const email = data.email?.trim().toLowerCase();
  const department = data.department?.trim();
  const level = data.level?.trim();
  const phone = data.phone?.trim() || null;
  const initialPassword = data.password?.trim() || "Ksitm@2026";

  if (!fullName || fullName.length < 3) return { success: false, error: "Full name required (min 3 chars)." };
  if (!regNumber || regNumber.length < 3) return { success: false, error: "Valid KSITM reg number required." };
  if (!email || !email.includes("@")) return { success: false, error: "Valid email required." };

  try {
    // Check duplicates
    const [existingEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail) return { success: false, error: "An account with this email address already exists." };

    const [existingReg] = await db.select({ id: studentProfiles.id }).from(studentProfiles).where(eq(studentProfiles.regNumber, regNumber)).limit(1);
    if (existingReg) return { success: false, error: "A student with this registration number already exists." };

    const passwordHash = await hashPassword(initialPassword);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: "STUDENT",
        isActive: true,
      })
      .returning();

    // Sync with institutional student master list
    const [existingMaster] = await db
      .select({ id: studentMasterList.id })
      .from(studentMasterList)
      .where(sql`upper(${studentMasterList.regNumber}) = upper(${regNumber})`)
      .limit(1);

    let masterRecordId = existingMaster?.id || null;

    if (existingMaster) {
      await db
        .update(studentMasterList)
        .set({
          isRegistered: true,
          registeredAt: new Date(),
          registeredUserId: newUser.id,
          updatedAt: new Date(),
        })
        .where(eq(studentMasterList.id, existingMaster.id));
    } else {
      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || "Student";
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
      const [insertedMaster] = await db
        .insert(studentMasterList)
        .values({
          regNumber,
          firstName,
          lastName,
          fullName,
          department,
          level,
          phone,
          isRegistered: true,
          registeredAt: new Date(),
          registeredUserId: newUser.id,
        })
        .returning({ id: studentMasterList.id });
      masterRecordId = insertedMaster?.id || null;
    }

    const [newStudent] = await db
      .insert(studentProfiles)
      .values({
        userId: newUser.id,
        masterRecordId,
        regNumber,
        fullName,
        department,
        level,
        phone,
        avatarUrl: data.avatarUrl?.trim() || null,
      })
      .returning();

    // Log initial occurrence
    await db.insert(studentOccurrences).values({
      studentId: newStudent.id,
      actorUserId: currentUser.id,
      actorName: "Super Admin",
      category: "ACHIEVEMENT",
      title: "Student Matriculation & Registry Created",
      description: `Official student dossier initialized under Department of ${department} (${level}).`,
    });

    await recordAuditLog({
      actorId: currentUser.id,
      action: "STUDENT_CREATED_ADMIN",
      entityType: "student_profiles",
      entityId: newStudent.id,
      details: { fullName, regNumber, email },
    });

    revalidatePath("/admin");
    return { success: true, studentId: newStudent.id };
  } catch (err: unknown) {
    console.error("[createStudentAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to create student." };
  }
}

/**
 * Super Admin: Update student details
 */
export async function updateStudentAction(
  studentId: string,
  data: {
    fullName: string;
    regNumber: string;
    department?: string;
    level?: string;
    phone?: string;
    isActive?: boolean;
    bio?: string;
    avatarUrl?: string;
    linkedInUrl?: string;
  },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return { success: false, error: "Super Admin privileges required." };
  }

  try {
    const [student] = await db
      .select({ userId: studentProfiles.userId })
      .from(studentProfiles)
      .where(eq(studentProfiles.id, studentId))
      .limit(1);

    if (!student) return { success: false, error: "Student not found." };

    await db
      .update(studentProfiles)
      .set({
        fullName: data.fullName.trim(),
        regNumber: data.regNumber.trim().toUpperCase(),
        department: data.department?.trim() || null,
        level: data.level?.trim() || null,
        phone: data.phone?.trim() || null,
        bio: data.bio?.trim() || null,
        avatarUrl: data.avatarUrl?.trim() || null,
        linkedInUrl: data.linkedInUrl?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.id, studentId));

    if (data.isActive !== undefined) {
      await db
        .update(users)
        .set({ isActive: data.isActive, updatedAt: new Date() })
        .where(eq(users.id, student.userId));
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "STUDENT_UPDATED_ADMIN",
      entityType: "student_profiles",
      entityId: studentId,
      details: { fullName: data.fullName },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    console.error("[updateStudentAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update student." };
  }
}

/**
 * Super Admin: Deactivate or delete student
 */
export async function deleteStudentAction(studentId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return { success: false, error: "Super Admin privileges required." };
  }

  try {
    const [student] = await db
      .select({ userId: studentProfiles.userId })
      .from(studentProfiles)
      .where(eq(studentProfiles.id, studentId))
      .limit(1);

    if (!student) return { success: false, error: "Student not found." };

    // Deactivate user record safely
    await db.update(users).set({ isActive: false }).where(eq(users.id, student.userId));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "STUDENT_DEACTIVATED_ADMIN",
      entityType: "student_profiles",
      entityId: studentId,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    console.error("[deleteStudentAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to deactivate student." };
  }
}

/**
 * Super Admin & Staff: Add an academic occurrence, milestone, or assessment observation to student's file
 */
export async function logStudentOccurrenceAction(
  studentId: string,
  data: {
    category: "ACHIEVEMENT" | "IMPROVEMENT" | "COUNSELING_NOTE" | "OCCURRENCE" | "ASSESSMENT_RESULT" | "OTHER";
    title: string;
    description: string;
    actionTaken?: string;
  },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    return { success: false, error: "Staff or Admin permissions required." };
  }

  if (!data.title?.trim() || !data.description?.trim()) {
    return { success: false, error: "Title and description are required for academic records." };
  }

  try {
    let actorName = currentUser.role === "SUPER_ADMIN" ? "Super Administrator" : "Career Staff Officer";
    if (currentUser.role === "STAFF") {
      const [staff] = await db.select({ fullName: staffProfiles.fullName }).from(staffProfiles).where(eq(staffProfiles.userId, currentUser.id)).limit(1);
      if (staff) actorName = staff.fullName;
    }

    const [created] = await db
      .insert(studentOccurrences)
      .values({
        studentId,
        actorUserId: currentUser.id,
        actorName,
        category: data.category,
        title: data.title.trim(),
        description: data.description.trim(),
        actionTaken: data.actionTaken?.trim() || null,
        occurrenceDate: new Date(),
      })
      .returning();

    await recordAuditLog({
      actorId: currentUser.id,
      action: "STUDENT_OCCURRENCE_LOGGED",
      entityType: "student_occurrences",
      entityId: created.id,
      details: { studentId, title: data.title, category: data.category },
    });

    revalidatePath("/admin");
    revalidatePath("/staff");

    return { success: true, occurrenceId: created.id };
  } catch (err: unknown) {
    console.error("[logStudentOccurrenceAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to log occurrence." };
  }
}

// ============================================================
// INSTITUTIONAL STUDENT MASTER LIST ACTIONS
// ============================================================

export type MasterListTableRow = {
  id: string;
  regNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  fullName: string;
  department: string | null;
  level: string | null;
  phone: string | null;
  isRegistered: boolean;
  registeredAt: Date | null;
  registeredUserId: string | null;
  studentProfileId: string | null;
  createdAt: Date;
};

export type MasterListQueryResult = {
  records: MasterListTableRow[];
  stats: {
    totalMaster: number;
    totalRegistered: number;
    totalPending: number;
  };
};

/**
 * Super Admin: List institutional student master records with filtering & search
 */
export async function listStudentMasterListAction(params?: {
  search?: string;
  status?: "ALL" | "REGISTERED" | "PENDING";
  department?: string;
}): Promise<MasterListQueryResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return {
      records: [],
      stats: { totalMaster: 0, totalRegistered: 0, totalPending: 0 },
    };
  }

  const allRecords = await db
    .select({
      master: studentMasterList,
      studentProfileId: studentProfiles.id,
    })
    .from(studentMasterList)
    .leftJoin(
      studentProfiles,
      sql`upper(${studentProfiles.regNumber}) = upper(${studentMasterList.regNumber})`,
    )
    .orderBy(desc(studentMasterList.createdAt));

  const totalMaster = allRecords.length;
  const totalRegistered = allRecords.filter((r) => r.master.isRegistered || !!r.studentProfileId).length;
  const totalPending = totalMaster - totalRegistered;

  let filtered = allRecords;

  if (params?.status === "REGISTERED") {
    filtered = filtered.filter((r) => r.master.isRegistered || !!r.studentProfileId);
  } else if (params?.status === "PENDING") {
    filtered = filtered.filter((r) => !r.master.isRegistered && !r.studentProfileId);
  }

  if (params?.department && params.department !== "ALL") {
    filtered = filtered.filter((r) => r.master.department === params.department);
  }

  if (params?.search && params.search.trim()) {
    const term = params.search.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.master.regNumber.toLowerCase().includes(term) ||
        r.master.fullName.toLowerCase().includes(term) ||
        r.master.firstName.toLowerCase().includes(term) ||
        r.master.lastName.toLowerCase().includes(term) ||
        (r.master.department && r.master.department.toLowerCase().includes(term)),
    );
  }

  return {
    records: filtered.map((r) => ({
      id: r.master.id,
      regNumber: r.master.regNumber,
      firstName: r.master.firstName,
      lastName: r.master.lastName,
      middleName: r.master.middleName,
      fullName: r.master.fullName,
      department: r.master.department,
      level: r.master.level,
      phone: r.master.phone,
      isRegistered: r.master.isRegistered || !!r.studentProfileId,
      registeredAt: r.master.registeredAt,
      registeredUserId: r.master.registeredUserId,
      studentProfileId: r.studentProfileId || null,
      createdAt: r.master.createdAt,
    })),
    stats: {
      totalMaster,
      totalRegistered,
      totalPending,
    },
  };
}

/**
 * Super Admin: Add an individual student to the institutional master list
 */
export async function createMasterRecordAction(data: {
  regNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  department?: string;
  level?: string;
  phone?: string;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return { success: false, error: "Super Admin privileges required." };
  }

  const regNumber = data.regNumber?.trim().toUpperCase();
  const firstName = data.firstName?.trim();
  const lastName = data.lastName?.trim();
  const middleName = data.middleName?.trim() || null;
  const department = data.department?.trim() || null;
  const level = data.level?.trim() || null;
  const phone = data.phone?.trim() || null;

  if (!regNumber || regNumber.length < 3) {
    return { success: false, error: "Valid KSITM registration number required." };
  }
  if (!firstName || firstName.length < 2) {
    return { success: false, error: "First name is required." };
  }
  if (!lastName || lastName.length < 2) {
    return { success: false, error: "Second name / Surname is required." };
  }

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  try {
    const [existing] = await db
      .select({ id: studentMasterList.id })
      .from(studentMasterList)
      .where(sql`upper(${studentMasterList.regNumber}) = upper(${regNumber})`)
      .limit(1);

    if (existing) {
      return {
        success: false,
        error: `A master record with registration number ${regNumber} already exists in the institutional registry.`,
      };
    }

    const [created] = await db
      .insert(studentMasterList)
      .values({
        regNumber,
        firstName,
        lastName,
        middleName,
        fullName,
        department,
        level,
        phone,
        isRegistered: false,
      })
      .returning();

    await recordAuditLog({
      actorId: currentUser.id,
      action: "MASTER_RECORD_CREATED",
      entityType: "STUDENT_MASTER_RECORD",
      entityId: created.id,
      details: { regNumber, fullName, department },
    });

    revalidatePath("/admin");
    return { success: true, recordId: created.id };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create master record." };
  }
}

/**
 * Super Admin: Update a student master record
 */
export async function updateMasterRecordAction(
  id: string,
  data: {
    regNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    department?: string;
    level?: string;
    phone?: string;
  },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return { success: false, error: "Super Admin privileges required." };
  }

  const regNumber = data.regNumber?.trim().toUpperCase();
  const firstName = data.firstName?.trim();
  const lastName = data.lastName?.trim();
  const middleName = data.middleName?.trim() || null;
  const department = data.department?.trim() || null;
  const level = data.level?.trim() || null;
  const phone = data.phone?.trim() || null;

  if (!regNumber || !firstName || !lastName) {
    return { success: false, error: "Registration number, first name, and last name are required." };
  }

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  try {
    await db
      .update(studentMasterList)
      .set({
        regNumber,
        firstName,
        lastName,
        middleName,
        fullName,
        department,
        level,
        phone,
        updatedAt: new Date(),
      })
      .where(eq(studentMasterList.id, id));

    revalidatePath("/admin");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update master record." };
  }
}

/**
 * Super Admin: Delete an un-registered student from the master list
 */
export async function deleteMasterRecordAction(id: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return { success: false, error: "Super Admin privileges required." };
  }

  try {
    const [record] = await db
      .select()
      .from(studentMasterList)
      .where(eq(studentMasterList.id, id))
      .limit(1);

    if (!record) {
      return { success: false, error: "Record not found." };
    }

    if (record.isRegistered) {
      return {
        success: false,
        error: "Cannot delete an enrolled student who has already registered their student portal. Archive or deactivate their account instead.",
      };
    }

    await db.delete(studentMasterList).where(eq(studentMasterList.id, id));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "MASTER_RECORD_DELETED",
      entityType: "STUDENT_MASTER_RECORD",
      entityId: id,
      details: { regNumber: record.regNumber, fullName: record.fullName },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete master record." };
  }
}

/**
 * Super Admin: Seed standard KSITM master list records
 */
export async function seedStandardMasterRecordsAction() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return { success: false, error: "Super Admin privileges required." };
  }

  const seeds = [
    {
      regNumber: "KSITM/ND/STE/24/001",
      firstName: "Amina",
      lastName: "Yusuf",
      middleName: "Bello",
      fullName: "Amina Bello Yusuf",
      department: "Computer Software Engineering",
      level: "National Diploma I (ND 1)",
      phone: "+234 802 111 2201",
    },
    {
      regNumber: "KSITM/ND/STE/24/002",
      firstName: "Ibrahim",
      lastName: "Bello",
      middleName: "Musa",
      fullName: "Ibrahim Musa Bello",
      department: "Computer Software Engineering",
      level: "National Diploma I (ND 1)",
      phone: "+234 803 222 3302",
    },
    {
      regNumber: "KSITM/ND/NSS/24/015",
      firstName: "Fatima",
      lastName: "Aliyu",
      middleName: "Gambo",
      fullName: "Fatima Gambo Aliyu",
      department: "Networking & System Security",
      level: "National Diploma I (ND 1)",
      phone: "+234 804 333 4403",
    },
    {
      regNumber: "KSITM/ND/BOP/24/008",
      firstName: "Usman",
      lastName: "Kabir",
      middleName: null,
      fullName: "Usman Kabir",
      department: "Banking Operations",
      level: "National Diploma I (ND 1)",
      phone: "+234 805 444 5504",
    },
    {
      regNumber: "KSITM/HND/CSE/23/004",
      firstName: "Zainab",
      lastName: "Sani",
      middleName: "Dikko",
      fullName: "Zainab Dikko Sani",
      department: "Computer Software Engineering",
      level: "Higher National Diploma II (HND 2)",
      phone: "+234 806 555 6605",
    },
    {
      regNumber: "KSITM/ND/MMT/24/011",
      firstName: "Abubakar",
      lastName: "Umar",
      middleName: "Faruk",
      fullName: "Abubakar Faruk Umar",
      department: "Multimedia Technology",
      level: "National Diploma I (ND 1)",
      phone: "+234 807 666 7706",
    },
  ];

  let addedCount = 0;
  for (const s of seeds) {
    const [existing] = await db
      .select({ id: studentMasterList.id })
      .from(studentMasterList)
      .where(sql`upper(${studentMasterList.regNumber}) = upper(${s.regNumber})`)
      .limit(1);

    if (!existing) {
      await db.insert(studentMasterList).values({
        regNumber: s.regNumber.toUpperCase(),
        firstName: s.firstName,
        lastName: s.lastName,
        middleName: s.middleName,
        fullName: s.fullName,
        department: s.department,
        level: s.level,
        phone: s.phone,
        isRegistered: false,
      });
      addedCount++;
    }
  }

  revalidatePath("/admin");
  return { success: true, addedCount };
}
