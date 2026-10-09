import { before, beforeEach, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { database, db, setActor } from "./fixture";
import {
  learningModules,
  moduleAssignments,
  studentProfiles,
  users,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  assignModuleAction,
  initializeModulesAction,
  listModulesAction,
  moduleRecordsAction,
  moduleRecordDetailAction,
  saveModuleAction,
  searchModuleStudentsAction,
  updateStudentModuleAction,
} from "@/actions/modules";
import {
  parseModuleContent,
  starterContent,
  validateAnswers,
} from "@/lib/modules";

const adminId = randomUUID(),
  userId = randomUUID(),
  studentId = randomUUID(),
  otherUserId = randomUUID(),
  otherStudentId = randomUUID();
const admin = {
  id: adminId,
  email: "admin@example.test",
  role: "SUPER_ADMIN" as const,
  isActive: true,
};
const student = {
  id: userId,
  email: "student@example.test",
  role: "STUDENT" as const,
  isActive: true,
  studentProfile: {
    id: studentId,
    regNumber: "TEST-001",
    fullName: "Test Student",
    department: "Computing",
    level: "100",
    phone: null,
  },
};
const other = {
  ...student,
  id: otherUserId,
  studentProfile: { ...student.studentProfile, id: otherStudentId },
};
let moduleId = "";
async function assigned() {
  setActor(admin);
  assert.ok(
    (
      await assignModuleAction(
        moduleId,
        studentId,
        "Practice before your appointment.",
      )
    ).data,
  );
  return (await db.select().from(moduleAssignments))[0];
}
before(async () => {
  for (const file of [
    "0000_foamy_black_queen.sql",
    "0001_ambitious_morlun.sql",
  ])
    await database.exec(readFileSync(`src/db/migrations/${file}`, "utf8"));
});
beforeEach(async () => {
  await database.exec("TRUNCATE users, learning_modules CASCADE");
  await db.insert(users).values([
    { ...admin, passwordHash: "test-only" },
    {
      id: userId,
      email: student.email,
      role: "STUDENT",
      passwordHash: "test-only",
    },
    {
      id: otherUserId,
      email: "other@example.test",
      role: "STUDENT",
      passwordHash: "test-only",
    },
  ]);
  await db.insert(studentProfiles).values([
    { ...student.studentProfile, userId },
    { ...other.studentProfile, userId: otherUserId, regNumber: "TEST-002" },
  ]);
  setActor(admin);
  const result = await initializeModulesAction();
  assert.equal(result.data?.length, 8);
  const definition = result.data!.find((m) => m.slug === "readiness")!;
  moduleId = definition.id;
  assert.ok(
    (
      await saveModuleAction({
        id: definition.id,
        title: definition.title,
        raw: JSON.stringify(definition.content),
        isPublished: true,
        version: definition.version,
      })
    ).data,
  );
});
after(async () => {
  await database.close();
});

test("validates raw questions, resource URLs and required responses", () => {
  const content = starterContent("readiness");
  assert.deepEqual(parseModuleContent(JSON.stringify(content)), content);
  assert.throws(
    () =>
      parseModuleContent(
        JSON.stringify({
          ...content,
          questions: [content.questions[0], content.questions[0]],
        }),
      ),
    /unique/,
  );
  assert.throws(
    () =>
      parseModuleContent(
        JSON.stringify({
          ...content,
          resources: [{ title: "Unsafe", url: "javascript:alert(1)" }],
        }),
      ),
    /HTTPS/,
  );
  assert.throws(() => validateAnswers(content, {}, true), /Answer required/);
  assert.throws(
    () => validateAnswers(content, { question_2: "6" }, false),
    /1–5/,
  );
  assert.throws(
    () => validateAnswers(content, { forged: "value" }, false),
    /does not match/,
  );
});
test("admin-only operations reject students and signed-out users", async () => {
  setActor(null);
  assert.match((await listModulesAction()).error!, /Super Admin/);
  setActor(student);
  assert.match(
    (await searchModuleStudentsAction("Test")).error!,
    /Super Admin/,
  );
  assert.match(
    (await assignModuleAction(moduleId, studentId, "")).error!,
    /Super Admin/,
  );
  assert.match((await moduleRecordsAction(moduleId)).error!, /Super Admin/);
});
test("assignments are unique and preserve the assigned content version", async () => {
  const first = await assigned();
  const definition = (
    await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.id, moduleId))
  )[0];
  const changed = {
    ...definition.content,
    instructions: "Changed after assignment",
  };
  await saveModuleAction({
    id: moduleId,
    title: definition.title,
    raw: JSON.stringify(changed),
    version: definition.version,
    isPublished: true,
  });
  const duplicate = await assignModuleAction(
    moduleId,
    studentId,
    "Different note",
  );
  assert.match(duplicate.data!.message, /already has/);
  const rows = await db.select().from(moduleAssignments);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].content, first.content);
  assert.equal(rows[0].note, first.note);
  assert.equal(rows[0].startedAt, null);
});
test("student start, save, resume and completion preserve the first start timestamp", async () => {
  const assignment = await assigned();
  setActor(student);
  const premature = await updateStudentModuleAction(
    assignment.id,
    assignment.version,
    "complete",
    {},
  );
  assert.match(premature.error!, /Start this module/);
  const started = (
    await updateStudentModuleAction(
      assignment.id,
      assignment.version,
      "start",
      {},
    )
  ).data!;
  assert.equal(started.status, "IN_PROGRESS");
  assert.ok(started.startedAt);
  const repeated = (
    await updateStudentModuleAction(
      assignment.id,
      assignment.version,
      "start",
      {},
    )
  ).data!;
  assert.equal(repeated.startedAt!.getTime(), started.startedAt!.getTime());
  const draft = (
    await updateStudentModuleAction(assignment.id, started.version, "save", {
      question_1: "Engineer",
    })
  ).data!;
  assert.equal(draft.answers.question_1, "Engineer");
  assert.equal(draft.startedAt!.getTime(), started.startedAt!.getTime());
  assert.match(
    (
      await updateStudentModuleAction(
        assignment.id,
        started.version,
        "save",
        {},
      )
    ).error!,
    /another window/,
  );
  assert.match(
    (
      await updateStudentModuleAction(
        assignment.id,
        draft.version,
        "complete",
        {},
      )
    ).error!,
    /Answer required/,
  );
  const completed = (
    await updateStudentModuleAction(assignment.id, draft.version, "complete", {
      question_1: "Engineer",
      question_2: "4",
    })
  ).data!;
  assert.equal(completed.status, "COMPLETED");
  assert.ok(completed.completedAt! >= completed.startedAt!);
  assert.match(
    (
      await updateStudentModuleAction(
        assignment.id,
        completed.version,
        "save",
        {},
      )
    ).error!,
    /already completed/,
  );
  setActor(admin);
  const detail = (await moduleRecordDetailAction(assignment.id)).data!;
  assert.equal(detail.assignment.answers.question_2, "4");
  assert.equal(detail.assignedByEmail, admin.email);
  assert.equal(
    (await moduleRecordsAction(moduleId, "COMPLETED", "TEST-001")).data!.rows
      .length,
    1,
  );
});
test("students cannot read or update another student's assignment", async () => {
  const assignment = await assigned();
  setActor(other);
  assert.match(
    (
      await updateStudentModuleAction(
        assignment.id,
        assignment.version,
        "start",
        {},
      )
    ).error!,
    /not assigned/,
  );
  assert.match(
    (await moduleRecordDetailAction(assignment.id)).error!,
    /Super Admin/,
  );
  const [record] = await db.select().from(moduleAssignments);
  assert.equal(record.status, "ASSIGNED");
});
test("search finds registration numbers, and drafts cannot be assigned", async () => {
  assert.equal((await searchModuleStudentsAction("TEST-001")).data!.length, 1);
  assert.equal((await searchModuleStudentsAction("%")).data!.length, 0);
  const draft = (await listModulesAction()).data!.find((m) => !m.isPublished)!;
  assert.match(
    (await assignModuleAction(draft.id, studentId, "")).error!,
    /Publish/,
  );
});
