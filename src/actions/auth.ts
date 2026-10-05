"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  users,
  studentProfiles,
  careerServices,
  studentServiceEntitlements,
} from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

export interface AuthActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectUrl?: string;
}

/**
 * Server action to register a new student account.
 */
export async function registerStudentAction(
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const fullName = formData.get("fullName")?.toString().trim() || "";
  const regNumber = formData.get("regNumber")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const department = formData.get("department")?.toString().trim() || null;
  const level = formData.get("level")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const password = formData.get("password")?.toString() || "";
  const confirmPassword = formData.get("confirmPassword")?.toString() || "";

  const fieldErrors: Record<string, string> = {};

  if (!fullName || fullName.length < 3) {
    fieldErrors.fullName = "Full name must be at least 3 characters long.";
  }

  if (!regNumber || regNumber.length < 3) {
    fieldErrors.regNumber = "A valid KSITM registration number is required.";
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Please provide a valid email address.";
  }

  if (!password || password.length < 8) {
    fieldErrors.password = "Password must be at least 8 characters long.";
  }

  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please correct the highlighted fields.", fieldErrors };
  }

  const normalizedRegNumber = regNumber.toUpperCase();

  try {
    // 1. Check if email already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`)
      .limit(1);

    if (existingUser) {
      return {
        error:
          "An account with this email address already exists. Please sign in.",
        fieldErrors: { email: "Email already in use." },
      };
    }

    // 2. Check if registration number already exists
    const [existingReg] = await db
      .select({ id: studentProfiles.id })
      .from(studentProfiles)
      .where(
        sql`upper(${studentProfiles.regNumber}) = upper(${normalizedRegNumber})`,
      )
      .limit(1);

    if (existingReg) {
      return {
        error:
          "This registration number is already registered. Please sign in.",
        fieldErrors: { regNumber: "Registration number already registered." },
      };
    }

    // 3. Hash password securely
    const passwordHash = await hashPassword(password);

    // 4. Create User record
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: "STUDENT",
        isActive: true,
      })
      .returning({ id: users.id, email: users.email });

    // 5. Create Student Profile record
    const [newStudent] = await db
      .insert(studentProfiles)
      .values({
        userId: newUser.id,
        regNumber: normalizedRegNumber,
        fullName,
        department,
        level,
        phone,
      })
      .returning({ id: studentProfiles.id });

    // 6. Provision initial service entitlements
    const allServices = await db
      .select({ id: careerServices.id, slug: careerServices.slug })
      .from(careerServices);

    if (allServices.length > 0) {
      const entitlementsToInsert = allServices.map((svc) => {
        // Consultations, Skills Training and AI Career Assistant are immediately active
        const isImmediatelyActive = [
          "consultations",
          "career-counseling",
          "employability-skills-training",
          "training",
          "ai-career-assistant",
        ].some((key) => svc.slug.includes(key));

        return {
          studentId: newStudent.id,
          serviceId: svc.id,
          status: (isImmediatelyActive ? "ACTIVE" : "LOCKED") as
            "LOCKED" | "ACTIVE" | "PAUSED" | "COMPLETED",
          activatedAt: isImmediatelyActive ? new Date() : null,
          recommendationNote: isImmediatelyActive
            ? "Provisioned upon student registration."
            : "Requires Career Advisor consultation and assessment.",
        };
      });

      await db.insert(studentServiceEntitlements).values(entitlementsToInsert);
    }

    // 7. Record security audit log
    await recordAuditLog({
      actorId: newUser.id,
      action: "STUDENT_REGISTERED",
      entityType: "STUDENT",
      entityId: newStudent.id,
      details: {
        regNumber: normalizedRegNumber,
        email,
        department,
        level,
      },
    });

    // 8. Create session & set cookie
    await createSession(newUser.id);
  } catch (error) {
    console.error("Registration error:", error);
    return {
      error:
        "An unexpected error occurred during registration. Please try again.",
    };
  }

  redirect("/dashboard");
}

/**
 * Server action to authenticate a student or staff member using registration number / email and password.
 */
export async function loginAction(
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const identifier = formData.get("identifier")?.toString().trim() || "";
  const password = formData.get("password")?.toString() || "";

  if (!identifier) {
    return {
      error: "Please enter your registration number or email address.",
      fieldErrors: { identifier: "Identifier required." },
    };
  }

  if (!password) {
    return {
      error: "Please enter your password.",
      fieldErrors: { password: "Password required." },
    };
  }

  let redirectDestination = "/dashboard";

  try {
    let targetUser: {
      id: string;
      email: string;
      passwordHash: string;
      role: "STUDENT" | "STAFF" | "SUPER_ADMIN";
      isActive: boolean;
    } | null = null;

    const cleanId = identifier.trim();
    let searchEmail = cleanId.toLowerCase();
    if (!searchEmail.includes("@")) {
      searchEmail = `${searchEmail}@ksitmcareers.org.ng`;
    }

    // Try finding by email (either entered directly or expanded from username)
    const [userRecord] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(
        sql`lower(${users.email}) = lower(${cleanId}) or lower(${users.email}) = lower(${searchEmail})`,
      )
      .limit(1);

    if (userRecord) {
      targetUser = userRecord;
    } else {
      // Lookup by registration number (for students)
      const [student] = await db
        .select({
          userId: studentProfiles.userId,
        })
        .from(studentProfiles)
        .where(sql`upper(${studentProfiles.regNumber}) = upper(${cleanId})`)
        .limit(1);

      if (student) {
        const [studentUser] = await db
          .select({
            id: users.id,
            email: users.email,
            passwordHash: users.passwordHash,
            role: users.role,
            isActive: users.isActive,
          })
          .from(users)
          .where(eq(users.id, student.userId))
          .limit(1);

        targetUser = studentUser || null;
      }
    }

    if (!targetUser) {
      return {
        error: "Invalid registration number/email or password.",
      };
    }

    if (!targetUser.isActive) {
      return {
        error:
          "This account has been deactivated. Please contact Career Services Centre.",
      };
    }

    // Verify password hash
    const isValidPassword = await verifyPassword(
      password,
      targetUser.passwordHash,
    );

    if (!isValidPassword) {
      return {
        error: "Invalid registration number/email or password.",
      };
    }

    // Record login audit event
    await recordAuditLog({
      actorId: targetUser.id,
      action: "USER_LOGIN",
      entityType: "USER",
      entityId: targetUser.id,
      details: {
        role: targetUser.role,
        identifierUsed: identifier.includes("@") ? "email" : "regNumber",
      },
    });

    // Create session & cookie
    await createSession(targetUser.id);

    // Set redirect destination based on role
    if (targetUser.role === "SUPER_ADMIN") {
      redirectDestination = "/admin";
    } else if (targetUser.role === "STAFF") {
      redirectDestination = "/staff";
    } else {
      redirectDestination = "/dashboard";
    }
  } catch (error) {
    // If Next.js redirect threw, re-throw to allow normal redirect flow
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("Login error:", error);
    return {
      error: "An unexpected error occurred during sign-in. Please try again.",
    };
  }

  redirect(redirectDestination);
}

/**
 * Server action to sign out the active user.
 */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
