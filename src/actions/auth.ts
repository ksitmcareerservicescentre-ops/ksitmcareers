"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  users,
  studentProfiles,
  studentMasterList,
  studentOccurrences,
  careerServices,
  studentServiceEntitlements,
} from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";
import { validateStudentNamesTally } from "@/lib/validators";

export interface AuthActionResult {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectUrl?: string;
}

/**
 * Server action to register a new student account.
 * Authenticates registration number and First/Second Name against the institutional master list.
 */
export async function registerStudentAction(
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  let firstName = formData.get("firstName")?.toString().trim() || "";
  let secondName =
    (formData.get("secondName") || formData.get("lastName"))?.toString().trim() ||
    "";
  let fullName = formData.get("fullName")?.toString().trim() || "";
  const regNumber = formData.get("regNumber")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const department = formData.get("department")?.toString().trim() || null;
  const level = formData.get("level")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const password = formData.get("password")?.toString() || "";
  const confirmPassword = formData.get("confirmPassword")?.toString() || "";

  // Support fallback parsing if fullName was provided without individual fields
  if (!firstName || !secondName) {
    if (fullName) {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        if (!firstName) firstName = parts[0];
        if (!secondName) secondName = parts.slice(1).join(" ");
      }
    }
  }

  if (!fullName && (firstName || secondName)) {
    fullName = [firstName, secondName].filter(Boolean).join(" ");
  }

  const fieldErrors: Record<string, string> = {};

  if (!firstName || firstName.length < 2) {
    fieldErrors.firstName = "First name is required (min. 2 characters).";
  }

  if (!secondName || secondName.length < 2) {
    fieldErrors.secondName =
      "Second name / Surname is required (min. 2 characters).";
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

    // 2. Authenticate against KSITM Institutional Student Master List
    const [masterRecord] = await db
      .select()
      .from(studentMasterList)
      .where(
        sql`upper(${studentMasterList.regNumber}) = upper(${normalizedRegNumber})`,
      )
      .limit(1);

    if (!masterRecord) {
      return {
        error: `Institutional Verification Failed: Registration Number "${normalizedRegNumber}" was not found in the official KSITM institutional master records. Only accredited enrolled students may register. Please verify your Matriculation / Registration Number or contact the KSITM Registry / Career Services Centre.`,
        fieldErrors: {
          regNumber:
            "Registration number not found in institutional master list.",
        },
      };
    }

    // 3. Check if registration number already registered in master list or active student profiles
    const [existingReg] = await db
      .select({ id: studentProfiles.id })
      .from(studentProfiles)
      .where(
        sql`upper(${studentProfiles.regNumber}) = upper(${normalizedRegNumber})`,
      )
      .limit(1);

    if (masterRecord.isRegistered || existingReg) {
      return {
        error: `Registration Number "${normalizedRegNumber}" is already registered. Please sign in with your credentials or reset your password if forgotten.`,
        fieldErrors: {
          regNumber: "Account already exists for this registration number.",
        },
      };
    }

    // 4. Authenticate First and Second Name tally with institutional master record
    const nameCheck = validateStudentNamesTally(
      firstName,
      secondName,
      masterRecord.firstName,
      masterRecord.lastName,
      masterRecord.middleName,
      masterRecord.fullName,
    );

    if (!nameCheck.matches) {
      return {
        error: `Identity Authentication Failed: The names provided ("${firstName} ${secondName}") do not tally with official institutional master records for ${normalizedRegNumber}. Please ensure your First and Second Name strictly match your official KSITM admission documents.`,
        fieldErrors: {
          firstName: "First name does not tally with institutional records.",
          secondName:
            "Second name / Surname does not tally with institutional records.",
        },
      };
    }

    // 5. Hash password securely
    const passwordHash = await hashPassword(password);

    // 6. Create User record
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: "STUDENT",
        isActive: true,
      })
      .returning({ id: users.id, email: users.email });

    // Official data from master record takes precedence for institutional consistency
    const resolvedFullName = masterRecord.fullName || `${firstName} ${secondName}`;
    const resolvedDepartment = masterRecord.department || department;
    const resolvedLevel = masterRecord.level || level;
    const resolvedPhone = phone || masterRecord.phone;

    // 7. Create Student Profile record linked to master record
    const [newStudent] = await db
      .insert(studentProfiles)
      .values({
        userId: newUser.id,
        masterRecordId: masterRecord.id,
        regNumber: normalizedRegNumber,
        fullName: resolvedFullName,
        department: resolvedDepartment,
        level: resolvedLevel,
        phone: resolvedPhone,
      })
      .returning({ id: studentProfiles.id });

    // 8. Update institutional master list entry to mark registered
    await db
      .update(studentMasterList)
      .set({
        isRegistered: true,
        registeredAt: new Date(),
        registeredUserId: newUser.id,
        updatedAt: new Date(),
      })
      .where(eq(studentMasterList.id, masterRecord.id));

    // 9. Record initial academic milestone occurrence in dossier
    await db.insert(studentOccurrences).values({
      studentId: newStudent.id,
      category: "MILESTONE",
      title: "Matriculation Verified & Account Activated",
      description: `Student verified against KSITM institutional master records for ${normalizedRegNumber} (${masterRecord.fullName}). Profile activated.`,
      actorName: "KSITM Automated Registry Gateway",
    });

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
