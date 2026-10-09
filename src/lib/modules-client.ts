"use client";

import * as actions from "@/actions/modules";
async function unwrap<T>(
  promise: Promise<
    { data: T; error?: never } | { data?: never; error: string }
  >,
): Promise<T> {
  const result = await promise;
  if (result.error !== undefined) throw new Error(result.error);
  return result.data as T;
}
export const listModulesAction = (
  ...args: Parameters<typeof actions.listModulesAction>
) => unwrap(actions.listModulesAction(...args));
export const initializeModulesAction = (
  ...args: Parameters<typeof actions.initializeModulesAction>
) => unwrap(actions.initializeModulesAction(...args));
export const saveModuleAction = (
  ...args: Parameters<typeof actions.saveModuleAction>
) => unwrap(actions.saveModuleAction(...args));
export const searchModuleStudentsAction = (
  ...args: Parameters<typeof actions.searchModuleStudentsAction>
) => unwrap(actions.searchModuleStudentsAction(...args));
export const assignModuleAction = (
  ...args: Parameters<typeof actions.assignModuleAction>
) => unwrap(actions.assignModuleAction(...args));
export const moduleRecordsAction = (
  ...args: Parameters<typeof actions.moduleRecordsAction>
) => unwrap(actions.moduleRecordsAction(...args));
export const moduleRecordDetailAction = (
  ...args: Parameters<typeof actions.moduleRecordDetailAction>
) => unwrap(actions.moduleRecordDetailAction(...args));
export const updateStudentModuleAction = (
  ...args: Parameters<typeof actions.updateStudentModuleAction>
) => unwrap(actions.updateStudentModuleAction(...args));
