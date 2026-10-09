"use server";

import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  learningModules,
  moduleAssignments,
  studentProfiles,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";
import {
  moduleCatalog,
  parseModuleContent,
  starterContent,
  validateAnswers,
  type ModuleStatus,
} from "@/lib/modules";

class ModuleInputError extends Error {}

async function admin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN")
    throw new ModuleInputError("Super Admin access required.");
  return user;
}
function uuid(value: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new ModuleInputError("Invalid record ID.");
  return value;
}
function refresh() {
  revalidatePath("/admin");
  revalidatePath("/dashboard/modules", "layout");
}

async function listModules() {
  await admin();
  return db.select().from(learningModules).orderBy(asc(learningModules.title));
}

async function initializeModules() {
  const actor = await admin();
  for (const item of moduleCatalog) {
    const existing = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.slug, item.slug));
    if (existing.length === 0) {
      await db.insert(learningModules).values({
        ...item,
        content: starterContent(item.slug),
      });
    } else if (!existing[0].isPublished) {
      await db
        .update(learningModules)
        .set({
          title: item.title,
          content: starterContent(item.slug),
          updatedAt: new Date(),
        })
        .where(eq(learningModules.id, existing[0].id));
    }
  }
  await recordAuditLog({
    actorId: actor.id,
    action: "MODULE_CATALOG_INITIALIZED",
    entityType: "learning_modules",
    entityId: "catalog",
  });
  return listModules();
}

async function saveModule(input: {
  id: string;
  title: string;
  raw: string;
  isPublished: boolean;
  version: number;
}) {
  const actor = await admin();
  uuid(input.id);
  if (
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.length > 160 ||
    typeof input.isPublished !== "boolean" ||
    !Number.isInteger(input.version)
  )
    throw new ModuleInputError("Enter a title of up to 160 characters.");
  let content;
  try {
    content = parseModuleContent(input.raw);
  } catch (error) {
    throw new ModuleInputError((error as Error).message);
  }
  if (
    input.isPublished &&
    !content.questions.length &&
    !content.resources.length
  )
    throw new ModuleInputError(
      "Add an activity or resource before publishing.",
    );
  const [saved] = await db
    .update(learningModules)
    .set({
      title: input.title.trim(),
      content,
      isPublished: input.isPublished,
      version: sql`${learningModules.version} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(learningModules.id, input.id),
        eq(learningModules.version, input.version),
      ),
    )
    .returning();
  if (!saved)
    throw new ModuleInputError(
      "This module changed in another window. Reload before saving.",
    );
  await recordAuditLog({
    actorId: actor.id,
    action: "MODULE_UPDATED",
    entityType: "learning_modules",
    entityId: saved.id,
    details: { version: saved.version },
  });
  refresh();
  return saved;
}

async function searchModuleStudents(query: string) {
  await admin();
  if (typeof query !== "string" || query.trim().length < 2) return [];
  const pattern = `%${query
    .trim()
    .slice(0, 100)
    .replace(/[\\%_]/g, "\\$&")}%`;
  return db
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
    .where(
      and(
        eq(users.role, "STUDENT"),
        eq(users.isActive, true),
        or(
          ilike(studentProfiles.fullName, pattern),
          ilike(studentProfiles.regNumber, pattern),
          ilike(users.email, pattern),
        ),
      ),
    )
    .orderBy(asc(studentProfiles.fullName), asc(studentProfiles.id))
    .limit(20);
}

async function assignModule(moduleId: string, studentId: string, note: string) {
  const actor = await admin();
  uuid(moduleId);
  uuid(studentId);
  if (typeof note !== "string" || note.length > 2000)
    throw new ModuleInputError(
      "Assignment notes must be under 2,000 characters.",
    );
  const [module] = await db
    .select()
    .from(learningModules)
    .where(
      and(
        eq(learningModules.id, moduleId),
        eq(learningModules.isPublished, true),
      ),
    );
  if (!module)
    throw new ModuleInputError("Publish this module before assigning it.");
  const [student] = await db
    .select({ id: studentProfiles.id })
    .from(studentProfiles)
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(
      and(
        eq(studentProfiles.id, studentId),
        eq(users.role, "STUDENT"),
        eq(users.isActive, true),
      ),
    );
  if (!student) throw new ModuleInputError("Select an active student.");
  const [assignment] = await db
    .insert(moduleAssignments)
    .values({
      moduleId,
      studentId,
      assignedBy: actor.id,
      title: module.title,
      content: module.content,
      moduleVersion: module.version,
      note: note.trim(),
    })
    .onConflictDoNothing({
      target: [moduleAssignments.studentId, moduleAssignments.moduleId],
    })
    .returning({ id: moduleAssignments.id });
  if (!assignment)
    return {
      message:
        "This student already has this module. Their progress was preserved.",
    };
  await recordAuditLog({
    actorId: actor.id,
    action: "MODULE_ASSIGNED",
    entityType: "module_assignments",
    entityId: assignment.id,
    details: { studentId, moduleId, moduleVersion: module.version },
  });
  refresh();
  return {
    message:
      "Module assigned. The start date will be recorded when the student begins.",
  };
}

async function moduleRecords(
  moduleId: string,
  filter: string = "ALL",
  query: string = "",
  page: number = 0,
) {
  await admin();
  uuid(moduleId);
  if (!["ALL", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(filter))
    throw new ModuleInputError("Invalid status.");
  const pattern = `%${query
    .trim()
    .slice(0, 100)
    .replace(/[\\%_]/g, "\\$&")}%`;
  const rows = await db
    .select({
      id: moduleAssignments.id,
      fullName: studentProfiles.fullName,
      regNumber: studentProfiles.regNumber,
      department: studentProfiles.department,
      level: studentProfiles.level,
      email: users.email,
      status: moduleAssignments.status,
      assignedAt: moduleAssignments.assignedAt,
      startedAt: moduleAssignments.startedAt,
      completedAt: moduleAssignments.completedAt,
      updatedAt: moduleAssignments.updatedAt,
      moduleVersion: moduleAssignments.moduleVersion,
    })
    .from(moduleAssignments)
    .innerJoin(
      studentProfiles,
      eq(moduleAssignments.studentId, studentProfiles.id),
    )
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(
      and(
        eq(moduleAssignments.moduleId, moduleId),
        filter === "ALL"
          ? undefined
          : eq(moduleAssignments.status, filter as ModuleStatus),
        query.trim()
          ? or(
              ilike(studentProfiles.fullName, pattern),
              ilike(studentProfiles.regNumber, pattern),
              ilike(users.email, pattern),
            )
          : undefined,
      ),
    )
    .orderBy(
      sql`${moduleAssignments.startedAt} DESC NULLS LAST`,
      desc(moduleAssignments.assignedAt),
      desc(moduleAssignments.id),
    )
    .limit(26)
    .offset(Math.max(0, Math.min(100000, Math.floor(page) || 0)) * 25);
  return { rows: rows.slice(0, 25), hasMore: rows.length > 25 };
}

async function moduleRecordDetail(id: string) {
  await admin();
  uuid(id);
  const [record] = await db
    .select({
      assignment: moduleAssignments,
      student: {
        fullName: studentProfiles.fullName,
        regNumber: studentProfiles.regNumber,
        department: studentProfiles.department,
        level: studentProfiles.level,
        phone: studentProfiles.phone,
      },
      assignedByEmail: users.email,
    })
    .from(moduleAssignments)
    .innerJoin(
      studentProfiles,
      eq(moduleAssignments.studentId, studentProfiles.id),
    )
    .innerJoin(users, eq(moduleAssignments.assignedBy, users.id))
    .where(eq(moduleAssignments.id, id));
  if (!record) throw new ModuleInputError("Record not found.");
  return record;
}

async function updateStudentModule(
  id: string,
  version: number,
  intent: "start" | "save" | "complete",
  input: unknown,
) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "STUDENT" || !actor.studentProfile)
    throw new ModuleInputError("Student access required.");
  uuid(id);
  if (
    !Number.isInteger(version) ||
    !["start", "save", "complete"].includes(intent)
  )
    throw new ModuleInputError("Invalid module action.");
  const owned = and(
    eq(moduleAssignments.id, id),
    eq(moduleAssignments.studentId, actor.studentProfile.id),
  );
  const [record] = await db.select().from(moduleAssignments).where(owned);
  if (!record)
    throw new ModuleInputError("This module is not assigned to you.");
  if (record.status === "COMPLETED")
    throw new ModuleInputError("This module is already completed.");
  if (intent === "start" && record.status !== "ASSIGNED") return record;
  if (intent !== "start" && record.status !== "IN_PROGRESS")
    throw new ModuleInputError("Start this module before saving answers.");
  let answers;
  try {
    answers =
      intent === "start"
        ? record.answers
        : validateAnswers(record.content, input, intent === "complete");
  } catch (error) {
    throw new ModuleInputError((error as Error).message);
  }
  const now = new Date();
  const [updated] = await db
    .update(moduleAssignments)
    .set({
      answers,
      status: intent === "complete" ? "COMPLETED" : "IN_PROGRESS",
      startedAt: record.startedAt ?? now,
      completedAt: intent === "complete" ? now : null,
      updatedAt: now,
      version: sql`${moduleAssignments.version} + 1`,
    })
    .where(
      and(
        owned,
        eq(moduleAssignments.version, version),
        eq(moduleAssignments.status, record.status),
      ),
    )
    .returning();
  if (!updated)
    throw new ModuleInputError(
      "Your record changed in another window. Reload to see the latest saved progress.",
    );
  await recordAuditLog({
    actorId: actor.id,
    action: `MODULE_${intent.toUpperCase()}`,
    entityType: "module_assignments",
    entityId: id,
    details: { version: updated.version, status: updated.status },
  });
  refresh();
  return updated;
}

async function result<T>(
  work: () => Promise<T>,
): Promise<{ data: T; error?: never } | { data?: never; error: string }> {
  try {
    return { data: await work() };
  } catch (error) {
    if (!(error instanceof ModuleInputError))
      console.error("[Modules] Operation failed", error);
    return {
      error:
        error instanceof ModuleInputError
          ? error.message
          : "Unable to complete the request. Please try again or contact support.",
    };
  }
}

export async function listModulesAction(
  ...args: Parameters<typeof listModules>
) {
  return result(() => listModules(...args));
}

export async function initializeModulesAction(
  ...args: Parameters<typeof initializeModules>
) {
  return result(() => initializeModules(...args));
}

export async function saveModuleAction(...args: Parameters<typeof saveModule>) {
  return result(() => saveModule(...args));
}

export async function searchModuleStudentsAction(
  ...args: Parameters<typeof searchModuleStudents>
) {
  return result(() => searchModuleStudents(...args));
}

export async function assignModuleAction(
  ...args: Parameters<typeof assignModule>
) {
  return result(() => assignModule(...args));
}

export async function moduleRecordsAction(
  ...args: Parameters<typeof moduleRecords>
) {
  return result(() => moduleRecords(...args));
}

export async function moduleRecordDetailAction(
  ...args: Parameters<typeof moduleRecordDetail>
) {
  return result(() => moduleRecordDetail(...args));
}

export async function updateStudentModuleAction(
  ...args: Parameters<typeof updateStudentModule>
) {
  return result(() => updateStudentModule(...args));
}
