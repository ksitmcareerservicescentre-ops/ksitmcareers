import { moduleCatalog, starterContent } from "@/lib/modules";
import type { learningModules } from "@/db/schema";

let modules: (typeof learningModules.$inferSelect)[] = moduleCatalog.map(
  (module, i) => ({
    ...module,
    id: `module-${i}`,
    content: starterContent(module.slug),
    version: 1,
    isPublished: false,
    updatedAt: new Date(),
  }),
);
export async function listModulesAction() {
  return modules;
}
export async function initializeModulesAction() {
  return modules;
}
export async function saveModuleAction(input: {
  id: string;
  title: string;
  raw: string;
  isPublished: boolean;
}) {
  modules = modules.map((module) =>
    module.id === input.id
      ? {
          ...module,
          title: input.title,
          content: JSON.parse(input.raw),
          isPublished: input.isPublished,
          version: module.version + 1,
        }
      : module,
  );
  return modules.find((module) => module.id === input.id)!;
}
export async function searchModuleStudentsAction() {
  return [
    {
      id: "student-1",
      fullName: "Test Student",
      regNumber: "TEST-001",
      department: "Computing",
      level: "100",
      email: "student@example.test",
    },
  ];
}
export async function assignModuleAction() {
  return {
    message:
      "Module assigned. The start date will be recorded when the student begins.",
  };
}
export async function moduleRecordsAction() {
  return { rows: [], hasMore: false };
}
export async function moduleRecordDetailAction() {
  throw new Error("No record selected in this UI fixture.");
}
