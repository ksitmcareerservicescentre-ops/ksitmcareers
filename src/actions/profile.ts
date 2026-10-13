"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, staffProfiles, studentProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { recordAuditLog } from "@/lib/audit";
import { isValidLinkedInUrl } from "@/lib/validators";

export type UserProfileData = {
  userId: string;
  email: string;
  role: "STUDENT" | "STAFF" | "SUPER_ADMIN";
  fullName: string;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  linkedInUrl: string | null;
  designation?: string | null;
  staffCode?: string | null;
  regNumber?: string | null;
  department?: string | null;
  level?: string | null;
};

/**
 * Fetch the active user's complete profile
 */
export async function getCurrentUserProfileDetailAction(): Promise<UserProfileData | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  if (currentUser.role === "STAFF") {
    const [staff] = await db
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, currentUser.id))
      .limit(1);

    return {
      userId: currentUser.id,
      email: currentUser.email,
      role: "STAFF",
      fullName: staff?.fullName || currentUser.email.split("@")[0],
      phone: staff?.phone || null,
      bio: staff?.bio || null,
      avatarUrl: staff?.avatarUrl || null,
      linkedInUrl: staff?.linkedInUrl || null,
      designation: staff?.designation || "Career Staff Officer",
      staffCode: staff?.staffCode || null,
    };
  }

  if (currentUser.role === "STUDENT") {
    const [student] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, currentUser.id))
      .limit(1);

    return {
      userId: currentUser.id,
      email: currentUser.email,
      role: "STUDENT",
      fullName: student?.fullName || currentUser.email.split("@")[0],
      phone: student?.phone || null,
      bio: student?.bio || null,
      avatarUrl: student?.avatarUrl || null,
      linkedInUrl: student?.linkedInUrl || null,
      regNumber: student?.regNumber || null,
      department: student?.department || null,
      level: student?.level || null,
    };
  }

  // Super Admin
  return {
    userId: currentUser.id,
    email: currentUser.email,
    role: "SUPER_ADMIN",
    fullName: "Super Administrator",
    phone: null,
    bio: "Chief Institutional Career Administrator & Governance Officer",
    avatarUrl: null,
    linkedInUrl: null,
    designation: "Chief Administrator",
  };
}

/**
 * Update personal profile (Staff or Student).
 * Validates that LinkedIn URL supports ONLY official LinkedIn domains.
 */
export async function updateUserProfileAction(data: {
  fullName: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  linkedInUrl?: string;
  department?: string;
  level?: string;
  designation?: string;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  if (!data.fullName?.trim() || data.fullName.trim().length < 2) {
    return { success: false, error: "Full name must be at least 2 characters." };
  }

  // Validate LinkedIn URL
  const candidateLinkedIn = data.linkedInUrl?.trim();
  if (candidateLinkedIn && !isValidLinkedInUrl(candidateLinkedIn)) {
    return {
      success: false,
      error: "Invalid LinkedIn URL. KSITM profiles strictly support official LinkedIn URLs (e.g. https://www.linkedin.com/in/username).",
    };
  }

  try {
    if (currentUser.role === "STAFF") {
      await db
        .update(staffProfiles)
        .set({
          fullName: data.fullName.trim(),
          phone: data.phone?.trim() || null,
          bio: data.bio?.trim() || null,
          avatarUrl: data.avatarUrl?.trim() || null,
          linkedInUrl: candidateLinkedIn || null,
          designation: data.designation?.trim() || undefined,
          updatedAt: new Date(),
        })
        .where(eq(staffProfiles.userId, currentUser.id));
    } else if (currentUser.role === "STUDENT") {
      await db
        .update(studentProfiles)
        .set({
          fullName: data.fullName.trim(),
          phone: data.phone?.trim() || null,
          bio: data.bio?.trim() || null,
          avatarUrl: data.avatarUrl?.trim() || null,
          linkedInUrl: candidateLinkedIn || null,
          department: data.department?.trim() || null,
          level: data.level?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(studentProfiles.userId, currentUser.id));
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "USER_PROFILE_UPDATED",
      entityType: "users",
      entityId: currentUser.id,
      details: { fullName: data.fullName },
    });

    revalidatePath("/admin");
    revalidatePath("/staff");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("[updateUserProfileAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update profile." };
  }
}

/**
 * Self-service password reset for all accounts EXCLUDING Super Admin.
 */
export async function resetPasswordAction(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  // Explicit policy: Exclude Super Admin from self-service password reset
  if (currentUser.role === "SUPER_ADMIN") {
    return {
      success: false,
      error: "Super Administrator accounts are excluded from web password resetting. Platform security policy mandates server-level credential management.",
    };
  }

  if (!data.currentPassword) {
    return { success: false, error: "Current password is required." };
  }
  if (!data.newPassword || data.newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters long." };
  }
  if (data.newPassword !== data.confirmPassword) {
    return { success: false, error: "New passwords do not match." };
  }

  try {
    // Fetch user password hash
    const [userRecord] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1);

    if (!userRecord) {
      return { success: false, error: "User account not found." };
    }

    const isValid = await verifyPassword(data.currentPassword, userRecord.passwordHash);
    if (!isValid) {
      return { success: false, error: "Incorrect current password. Please verify and try again." };
    }

    // Hash new password
    const newHash = await hashPassword(data.newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "PASSWORD_RESET_SUCCESS",
      entityType: "users",
      entityId: currentUser.id,
    });

    return { success: true, message: "Your password has been securely updated." };
  } catch (err: unknown) {
    console.error("[resetPasswordAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to reset password." };
  }
}
