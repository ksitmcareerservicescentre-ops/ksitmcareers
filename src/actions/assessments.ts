"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql, desc, inArray, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import {
  assessments,
  assessmentQuestions,
  assessmentAttempts,
  assessmentResponses,
  studentProfiles,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";
import {
  ObjectiveQuestionData,
  AssessmentSummary,
  StudentParticipantRecord,
  starterNaceQuestions,
} from "@/lib/assessments";

type StoredQuestionOptions = {
  choices?: Array<{ id: string; text: string }>;
  correctOption?: string;
  explanation?: string;
  points?: number;
};

// Helper: slugify title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Super Admin & Staff: List all assessments with summary metrics
 */
export async function listAssessmentsAction(): Promise<AssessmentSummary[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    throw new Error("Unauthorized access");
  }

  const allAssessments = await db
    .select()
    .from(assessments)
    .orderBy(desc(assessments.createdAt));

  if (!allAssessments.length) return [];

  const results: AssessmentSummary[] = [];

  for (const a of allAssessments) {
    // Count questions
    const [qCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentId, a.id));

    // Count attempts/assignments
    const attempts = await db
      .select({
        status: assessmentAttempts.status,
        score: assessmentAttempts.score,
      })
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.assessmentId, a.id));

    const totalAssignments = attempts.length;
    const completedAttempts = attempts.filter((att) => att.status === "SUBMITTED" || att.status === "REVIEWED");
    const completedCount = completedAttempts.length;

    let averageScore: number | null = null;
    let passRate: number | null = null;

    if (completedCount > 0) {
      const sum = completedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
      averageScore = Math.round(sum / completedCount);
      const passedCount = completedAttempts.filter((att) => (att.score || 0) >= a.passingScore).length;
      passRate = Math.round((passedCount / completedCount) * 100);
    }

    results.push({
      id: a.id,
      title: a.title,
      slug: a.slug,
      description: a.description,
      category: a.category,
      timeLimitMinutes: a.timeLimitMinutes,
      passingScore: a.passingScore,
      isActive: a.isActive,
      questionCount: qCount?.count || 0,
      totalAssignments,
      completedCount,
      averageScore,
      passRate,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    });
  }

  return results;
}

/**
 * Super Admin & Staff: Get full assessment details with all objective questions
 */
export async function getAssessmentDetailAction(assessmentId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    throw new Error("Unauthorized access");
  }

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  if (!assessment) return null;

  const rawQuestions = await db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessmentId))
    .orderBy(assessmentQuestions.displayOrder);

  const questions: ObjectiveQuestionData[] = rawQuestions.map((q) => {
    const opts = (q.options as StoredQuestionOptions | null) || {};
    return {
      id: q.id,
      questionText: q.questionText,
      questionType: (q.questionType as "MULTIPLE_CHOICE" | "SCALE_1_5" | "TEXT") || "MULTIPLE_CHOICE",
      options: {
        choices: (opts.choices || []).map((c) => ({ id: c.id, text: c.text })),
        correctOption: opts.correctOption || "A",
        explanation: opts.explanation,
        points: opts.points || 1,
      },
      displayOrder: q.displayOrder,
    };
  });

  return {
    ...assessment,
    questions,
  };
}

/**
 * Super Admin & Staff: Create new assessment with up to 300 objective questions
 */
export async function createAssessmentAction(data: {
  title: string;
  slug?: string;
  description: string;
  category: string;
  timeLimitMinutes: number;
  passingScore: number;
  isActive: boolean;
  questions: ObjectiveQuestionData[];
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    return { success: false, error: "Unauthorized. Super Admin or Career Staff permissions required." };
  }

  if (!data.title?.trim()) {
    return { success: false, error: "Assessment title is required." };
  }

  if (!data.questions?.length) {
    return { success: false, error: "At least one objective question is required." };
  }

  if (data.questions.length > 300) {
    return { success: false, error: "Maximum limit is 300 objective questions per assessment." };
  }

  try {
    let baseSlug = slugify(data.slug || data.title);
    if (!baseSlug) baseSlug = "assessment";

    // Ensure unique slug
    let candidateSlug = baseSlug;
    let count = 1;
    while (true) {
      const existing = await db
        .select({ id: assessments.id })
        .from(assessments)
        .where(eq(assessments.slug, candidateSlug))
        .limit(1);
      if (!existing.length) break;
      candidateSlug = `${baseSlug}-${count++}`;
    }

    const [created] = await db
      .insert(assessments)
      .values({
        title: data.title.trim(),
        slug: candidateSlug,
        description: data.description?.trim() || "",
        category: data.category?.trim() || "General Readiness",
        timeLimitMinutes: Math.max(1, data.timeLimitMinutes || 30),
        passingScore: Math.min(100, Math.max(1, data.passingScore || 60)),
        isActive: Boolean(data.isActive),
      })
      .returning();

    // Insert questions
    const questionValues = data.questions.map((q, idx) => ({
      assessmentId: created.id,
      questionText: q.questionText.trim(),
      questionType: q.questionType || "MULTIPLE_CHOICE",
      options: q.options,
      displayOrder: idx + 1,
    }));

    if (questionValues.length > 0) {
      await db.insert(assessmentQuestions).values(questionValues);
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "ASSESSMENT_CREATED",
      entityType: "assessments",
      entityId: created.id,
      details: { title: created.title, questionsCount: questionValues.length },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assessments");

    return { success: true, assessmentId: created.id };
  } catch (err: unknown) {
    console.error("[createAssessmentAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to create assessment." };
  }
}

/**
 * Super Admin & Staff: Update existing assessment
 */
export async function updateAssessmentAction(
  assessmentId: string,
  data: {
    title: string;
    description: string;
    category: string;
    timeLimitMinutes: number;
    passingScore: number;
    isActive: boolean;
    questions: ObjectiveQuestionData[];
  },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    return { success: false, error: "Unauthorized access." };
  }

  if (!data.title?.trim()) {
    return { success: false, error: "Assessment title is required." };
  }

  if (!data.questions?.length) {
    return { success: false, error: "At least one objective question is required." };
  }

  if (data.questions.length > 300) {
    return { success: false, error: "Maximum limit is 300 objective questions per assessment." };
  }

  try {
    const [updated] = await db
      .update(assessments)
      .set({
        title: data.title.trim(),
        description: data.description?.trim() || "",
        category: data.category?.trim() || "General Readiness",
        timeLimitMinutes: Math.max(1, data.timeLimitMinutes || 30),
        passingScore: Math.min(100, Math.max(1, data.passingScore || 60)),
        isActive: Boolean(data.isActive),
        updatedAt: new Date(),
      })
      .where(eq(assessments.id, assessmentId))
      .returning();

    if (!updated) {
      return { success: false, error: "Assessment not found." };
    }

    // Replace questions: delete previous and insert updated batch
    await db.delete(assessmentQuestions).where(eq(assessmentQuestions.assessmentId, assessmentId));

    const questionValues = data.questions.map((q, idx) => ({
      assessmentId,
      questionText: q.questionText.trim(),
      questionType: q.questionType || "MULTIPLE_CHOICE",
      options: q.options,
      displayOrder: idx + 1,
    }));

    if (questionValues.length > 0) {
      await db.insert(assessmentQuestions).values(questionValues);
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "ASSESSMENT_UPDATED",
      entityType: "assessments",
      entityId: assessmentId,
      details: { title: updated.title, questionsCount: questionValues.length },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assessments");

    return { success: true };
  } catch (err: unknown) {
    console.error("[updateAssessmentAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update assessment." };
  }
}

/**
 * Super Admin: Delete assessment (cascades questions, attempts, responses)
 */
export async function deleteAssessmentAction(assessmentId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return { success: false, error: "Super Admin privileges required to delete assessments." };
  }

  try {
    const [deleted] = await db
      .delete(assessments)
      .where(eq(assessments.id, assessmentId))
      .returning();

    if (!deleted) {
      return { success: false, error: "Assessment not found." };
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "ASSESSMENT_DELETED",
      entityType: "assessments",
      entityId: assessmentId,
      details: { title: deleted.title },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assessments");

    return { success: true };
  } catch (err: unknown) {
    console.error("[deleteAssessmentAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete assessment." };
  }
}

/**
 * Search students for assignment
 */
export async function searchStudentsForAssessmentAction(
  assessmentId: string,
  query: string,
  departmentFilter?: string,
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    throw new Error("Unauthorized access");
  }

  const q = `%${query.trim()}%`;
  const conditions = [
    or(
      ilike(studentProfiles.fullName, q),
      ilike(studentProfiles.regNumber, q),
      ilike(users.email, q),
      ilike(studentProfiles.department, q),
    ),
  ];

  if (departmentFilter && departmentFilter !== "ALL") {
    conditions.push(eq(studentProfiles.department, departmentFilter));
  }

  const students = await db
    .select({
      id: studentProfiles.id,
      fullName: studentProfiles.fullName,
      regNumber: studentProfiles.regNumber,
      department: studentProfiles.department,
      level: studentProfiles.level,
      email: users.email,
    })
    .from(studentProfiles)
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(and(...conditions))
    .limit(50);

  // Check which are already assigned
  const existingAttempts = await db
    .select({ studentId: assessmentAttempts.studentId })
    .from(assessmentAttempts)
    .where(eq(assessmentAttempts.assessmentId, assessmentId));

  const assignedStudentIds = new Set(existingAttempts.map((a) => a.studentId));

  return students.map((s) => ({
    ...s,
    isAssigned: assignedStudentIds.has(s.id),
  }));
}

/**
 * Assign assessment to selected students
 */
export async function assignAssessmentToStudentsAction(assessmentId: string, studentIds: string[]) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    return { success: false, error: "Unauthorized access." };
  }

  if (!studentIds.length) {
    return { success: false, error: "Please select at least one student to assign." };
  }

  try {
    // Check existing
    const existing = await db
      .select({ studentId: assessmentAttempts.studentId })
      .from(assessmentAttempts)
      .where(and(eq(assessmentAttempts.assessmentId, assessmentId), inArray(assessmentAttempts.studentId, studentIds)));

    const alreadyAssigned = new Set(existing.map((e) => e.studentId));
    const newStudentIds = studentIds.filter((id) => !alreadyAssigned.has(id));

    if (!newStudentIds.length) {
      return { success: true, count: 0, message: "All selected students are already assigned to this assessment." };
    }

    const values = newStudentIds.map((studentId) => ({
      assessmentId,
      studentId,
      status: "ASSIGNED" as const,
      createdAt: new Date(),
    }));

    await db.insert(assessmentAttempts).values(values);

    await recordAuditLog({
      actorId: currentUser.id,
      action: "ASSESSMENT_ASSIGNED",
      entityType: "assessments",
      entityId: assessmentId,
      details: { newlyAssignedCount: newStudentIds.length },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/assessments");

    return { success: true, count: newStudentIds.length };
  } catch (err: unknown) {
    console.error("[assignAssessmentToStudentsAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to assign assessment." };
  }
}

/**
 * Super Admin & Staff: Get all participants / takers with their score and status
 */
export async function getAssessmentParticipantsAction(
  assessmentId?: string,
  query?: string,
  statusFilter?: string,
): Promise<StudentParticipantRecord[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    throw new Error("Unauthorized access");
  }

  const conditions = [];

  if (assessmentId) {
    conditions.push(eq(assessmentAttempts.assessmentId, assessmentId));
  }

  if (statusFilter && statusFilter !== "ALL") {
    conditions.push(
      eq(
        assessmentAttempts.status,
        statusFilter as "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED",
      ),
    );
  }

  if (query && query.trim()) {
    const q = `%${query.trim()}%`;
    conditions.push(
      or(
        ilike(studentProfiles.fullName, q),
        ilike(studentProfiles.regNumber, q),
        ilike(users.email, q),
        ilike(assessments.title, q),
      ),
    );
  }

  const rows = await db
    .select({
      attemptId: assessmentAttempts.id,
      assessmentId: assessments.id,
      assessmentTitle: assessments.title,
      passingScore: assessments.passingScore,
      studentId: studentProfiles.id,
      studentName: studentProfiles.fullName,
      regNumber: studentProfiles.regNumber,
      department: studentProfiles.department,
      level: studentProfiles.level,
      email: users.email,
      status: assessmentAttempts.status,
      score: assessmentAttempts.score,
      completedAt: assessmentAttempts.completedAt,
      assignedAt: assessmentAttempts.createdAt,
      humanRecommendation: assessmentAttempts.humanRecommendation,
    })
    .from(assessmentAttempts)
    .innerJoin(assessments, eq(assessmentAttempts.assessmentId, assessments.id))
    .innerJoin(studentProfiles, eq(assessmentAttempts.studentId, studentProfiles.id))
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(assessmentAttempts.createdAt));

  return rows.map((r) => ({
    attemptId: r.attemptId,
    assessmentId: r.assessmentId,
    assessmentTitle: r.assessmentTitle,
    studentId: r.studentId,
    studentName: r.studentName,
    regNumber: r.regNumber,
    department: r.department,
    level: r.level,
    email: r.email,
    status: (r.status as "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED") || "ASSIGNED",
    score: r.score,
    passingScore: r.passingScore,
    passed: r.score !== null ? r.score >= r.passingScore : null,
    assignedAt: r.assignedAt,
    completedAt: r.completedAt,
    humanRecommendation: r.humanRecommendation,
  }));
}

/**
 * Super Admin & Staff: Inspect student's question-by-question responses
 */
export async function getStudentAttemptDetailAction(attemptId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized access");

  const [attempt] = await db
    .select({
      id: assessmentAttempts.id,
      assessmentId: assessmentAttempts.assessmentId,
      studentId: assessmentAttempts.studentId,
      status: assessmentAttempts.status,
      score: assessmentAttempts.score,
      completedAt: assessmentAttempts.completedAt,
      assignedAt: assessmentAttempts.createdAt,
      humanRecommendation: assessmentAttempts.humanRecommendation,
      assessmentTitle: assessments.title,
      passingScore: assessments.passingScore,
      timeLimitMinutes: assessments.timeLimitMinutes,
      studentName: studentProfiles.fullName,
      regNumber: studentProfiles.regNumber,
      department: studentProfiles.department,
      email: users.email,
    })
    .from(assessmentAttempts)
    .innerJoin(assessments, eq(assessmentAttempts.assessmentId, assessments.id))
    .innerJoin(studentProfiles, eq(assessmentAttempts.studentId, studentProfiles.id))
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(eq(assessmentAttempts.id, attemptId))
    .limit(1);

  if (!attempt) return null;

  // If student is viewing, ensure ownership
  if (currentUser.role === "STUDENT" && currentUser.studentProfile?.id !== attempt.studentId) {
    throw new Error("Unauthorized access");
  }

  // Fetch all questions for this assessment
  const questions = await db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, attempt.assessmentId))
    .orderBy(assessmentQuestions.displayOrder);

  // Fetch student's responses
  const responses = await db
    .select()
    .from(assessmentResponses)
    .where(eq(assessmentResponses.attemptId, attemptId));

  const responseMap = new Map(responses.map((r) => [r.questionId, r]));

  const questionBreakdown = questions.map((q) => {
    const opts = (q.options as StoredQuestionOptions | null) || {};
    const resp = responseMap.get(q.id);
    const chosen = resp?.responseText || null;
    const isCorrect = resp?.scoreValue === 1;

    return {
      questionId: q.id,
      displayOrder: q.displayOrder,
      questionText: q.questionText,
      choices: opts.choices || [],
      correctOption: opts.correctOption,
      explanation: opts.explanation,
      chosenOption: chosen,
      isCorrect,
    };
  });

  return {
    attempt,
    questions: questionBreakdown,
  };
}

/**
 * Student Portal: Fetch all assessments assigned to the logged-in student
 */
export async function getStudentAssignedAssessmentsAction() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.studentProfile) {
    return [];
  }

  const rows = await db
    .select({
      attemptId: assessmentAttempts.id,
      assessmentId: assessments.id,
      title: assessments.title,
      description: assessments.description,
      category: assessments.category,
      timeLimitMinutes: assessments.timeLimitMinutes,
      passingScore: assessments.passingScore,
      status: assessmentAttempts.status,
      score: assessmentAttempts.score,
      assignedAt: assessmentAttempts.createdAt,
      completedAt: assessmentAttempts.completedAt,
    })
    .from(assessmentAttempts)
    .innerJoin(assessments, eq(assessmentAttempts.assessmentId, assessments.id))
    .where(and(eq(assessmentAttempts.studentId, currentUser.studentProfile.id), eq(assessments.isActive, true)))
    .orderBy(desc(assessmentAttempts.createdAt));

  const results = [];

  for (const r of rows) {
    const [qCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentId, r.assessmentId));

    results.push({
      ...r,
      totalQuestions: qCount?.count || 0,
      passed: r.score !== null ? r.score >= r.passingScore : null,
    });
  }

  return results;
}

/**
 * Student Portal: Start or resume taking an assessment
 */
export async function startAssessmentAttemptAction(attemptId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.studentProfile) {
    return { success: false, error: "Student login required." };
  }

  const [attempt] = await db
    .select()
    .from(assessmentAttempts)
    .where(and(eq(assessmentAttempts.id, attemptId), eq(assessmentAttempts.studentId, currentUser.studentProfile.id)))
    .limit(1);

  if (!attempt) {
    return { success: false, error: "Assessment assignment not found." };
  }

  if (attempt.status === "SUBMITTED" || attempt.status === "REVIEWED") {
    return { success: false, error: "This assessment has already been submitted and scored." };
  }

  // Update status to IN_PROGRESS if was ASSIGNED
  if (attempt.status === "ASSIGNED") {
    await db
      .update(assessmentAttempts)
      .set({ status: "IN_PROGRESS" })
      .where(eq(assessmentAttempts.id, attemptId));
  }

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, attempt.assessmentId))
    .limit(1);

  const rawQuestions = await db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, attempt.assessmentId))
    .orderBy(assessmentQuestions.displayOrder);

  // SANITIZE: Do NOT expose correctOption or explanation to the student while taking!
  const sanitizedQuestions = rawQuestions.map((q) => {
    const opts = (q.options as StoredQuestionOptions | null) || {};
    return {
      id: q.id,
      displayOrder: q.displayOrder,
      questionText: q.questionText,
      choices: (opts.choices || []).map((c) => ({ id: c.id, text: c.text })),
    };
  });

  return {
    success: true,
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      category: assessment.category,
      timeLimitMinutes: assessment.timeLimitMinutes,
      passingScore: assessment.passingScore,
    },
    questions: sanitizedQuestions,
  };
}

/**
 * Student Portal: Submit objective answers, auto-grade and record score
 */
export async function submitAssessmentAttemptAction(
  attemptId: string,
  answers: Record<string, string>, // questionId -> chosenOption ("A", "B", etc.)
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.studentProfile) {
    return { success: false, error: "Student login required." };
  }

  const [attempt] = await db
    .select()
    .from(assessmentAttempts)
    .where(and(eq(assessmentAttempts.id, attemptId), eq(assessmentAttempts.studentId, currentUser.studentProfile.id)))
    .limit(1);

  if (!attempt) {
    return { success: false, error: "Assessment assignment not found." };
  }

  if (attempt.status === "SUBMITTED" || attempt.status === "REVIEWED") {
    return { success: false, error: "Assessment has already been submitted." };
  }

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, attempt.assessmentId))
    .limit(1);

  const questions = await db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, attempt.assessmentId))
    .orderBy(assessmentQuestions.displayOrder);

  if (!questions.length) {
    return { success: false, error: "No questions found for this assessment." };
  }

  const totalQuestions = questions.length;
  let correctCount = 0;
  const responseInserts = [];

  for (const q of questions) {
    const opts = (q.options as StoredQuestionOptions | null) || {};
    const correctOpt = (opts.correctOption || "").toUpperCase();
    const studentChoice = (answers[q.id] || "").toUpperCase();

    const isCorrect = studentChoice && studentChoice === correctOpt;
    if (isCorrect) correctCount++;

    responseInserts.push({
      attemptId,
      questionId: q.id,
      responseText: studentChoice || "SKIPPED",
      scoreValue: isCorrect ? 1 : 0,
      createdAt: new Date(),
    });
  }

  const finalScorePercent = Math.round((correctCount / totalQuestions) * 100);
  const passed = finalScorePercent >= assessment.passingScore;

  // Insert responses
  if (responseInserts.length) {
    await db.insert(assessmentResponses).values(responseInserts);
  }

  // Update attempt
  const summaryFeedback = `Automated Grade: ${finalScorePercent}% (${correctCount}/${totalQuestions} Correct). Status: ${
    passed ? "PASSED" : "NEEDS IMPROVEMENT"
  }.`;

  await db
    .update(assessmentAttempts)
    .set({
      status: "SUBMITTED",
      score: finalScorePercent,
      completedAt: new Date(),
      humanRecommendation: summaryFeedback,
    })
    .where(eq(assessmentAttempts.id, attemptId));

  await recordAuditLog({
    actorId: currentUser.id,
    action: "ASSESSMENT_SUBMITTED",
    entityType: "assessment_attempts",
    entityId: attemptId,
    details: {
      assessmentTitle: assessment.title,
      score: finalScorePercent,
      correctCount,
      totalQuestions,
      passed,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assessments");
  revalidatePath("/admin");

  return {
    success: true,
    score: finalScorePercent,
    correctCount,
    totalQuestions,
    passed,
    passingScore: assessment.passingScore,
  };
}

/**
 * Super Admin & Staff: Initialize the default NACE Career Readiness Assessment if catalog is empty
 */
export async function initializeStarterAssessmentAction() {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    return { success: false, error: "Unauthorized access." };
  }

  const existing = await db.select({ id: assessments.id }).from(assessments).limit(1);
  if (existing.length > 0) {
    return { success: false, error: "Assessments catalog already contains assessments." };
  }

  return await createAssessmentAction({
    title: "KSITM Institutional Career Readiness Diagnostic",
    slug: "ksitm-career-readiness-diagnostic",
    description:
      "Comprehensive diagnostic assessment evaluating student workplace readiness across NACE 8 competencies, ATS resume optimization, STAR behavioral articulation, and professional communications.",
    category: "Diagnostic Core",
    timeLimitMinutes: 30,
    passingScore: 70,
    isActive: true,
    questions: starterNaceQuestions,
  });
}
