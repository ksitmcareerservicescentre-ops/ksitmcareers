import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { AuthenticatedUser } from "@/lib/auth/session";

export const database = new PGlite();
export const db = drizzle(database);
export let actor: AuthenticatedUser | null = null;
export function setActor(user: AuthenticatedUser | null) {
  actor = user;
}
export async function getCurrentUser() {
  return actor;
}
export function revalidatePath() {}
