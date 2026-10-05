import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, studentProfiles, staffProfiles } from "@/db/schema";

export const SESSION_COOKIE_NAME = "ksitm_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "STUDENT" | "STAFF" | "SUPER_ADMIN";
  isActive: boolean;
  studentProfile?: {
    id: string;
    regNumber: string;
    fullName: string;
    department: string | null;
    level: string | null;
    phone: string | null;
  } | null;
  staffProfile?: {
    id: string;
    fullName: string;
    staffCode: string | null;
    designation: string | null;
  } | null;
}

/**
 * Creates a cryptographically secure session for a user, stores the SHA-256 hash in DB,
 * and sets the HTTP-only session cookie.
 */
export async function createSession(
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
  });

  await setSessionCookie(token, expiresAt);

  return { token, expiresAt };
}

/**
 * Hashes a raw session token using SHA-256 for secure DB lookup.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Sets the secure session cookie on the client response.
 */
export async function setSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const cookieStore = await cookies();
  const isSecure =
    process.env.VERCEL === "1" || process.env.COOKIE_SECURE === "true";

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Clears the session cookie from the client.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Validates a raw session token against the database and returns the authenticated user.
 */
export async function validateSessionToken(
  token: string,
): Promise<AuthenticatedUser | null> {
  const tokenHash = hashToken(token);
  const now = new Date();

  const [sessionRecord] = await db
    .select({
      sessionId: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
      user: {
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1);

  if (!sessionRecord || !sessionRecord.user || !sessionRecord.user.isActive) {
    return null;
  }

  const authenticatedUser: AuthenticatedUser = {
    id: sessionRecord.user.id,
    email: sessionRecord.user.email,
    role: sessionRecord.user.role as "STUDENT" | "STAFF" | "SUPER_ADMIN",
    isActive: sessionRecord.user.isActive,
  };

  if (sessionRecord.user.role === "STUDENT") {
    const [student] = await db
      .select({
        id: studentProfiles.id,
        regNumber: studentProfiles.regNumber,
        fullName: studentProfiles.fullName,
        department: studentProfiles.department,
        level: studentProfiles.level,
        phone: studentProfiles.phone,
      })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, sessionRecord.user.id))
      .limit(1);

    authenticatedUser.studentProfile = student || null;
  } else if (
    sessionRecord.user.role === "STAFF" ||
    sessionRecord.user.role === "SUPER_ADMIN"
  ) {
    const [staff] = await db
      .select({
        id: staffProfiles.id,
        fullName: staffProfiles.fullName,
        staffCode: staffProfiles.staffCode,
        designation: staffProfiles.designation,
      })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, sessionRecord.user.id))
      .limit(1);

    authenticatedUser.staffProfile = staff || null;
  }

  return authenticatedUser;
}

/**
 * Retrieves the currently authenticated user from the active request cookies.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return validateSessionToken(token);
}

/**
 * Destroys a session both in the database and by clearing the client cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  await clearSessionCookie();
}
