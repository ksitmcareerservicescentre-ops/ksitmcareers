"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, and, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  careerFairs,
  careerFairBooths,
  careerFairRegistrations,
  studentProfiles,
  partnerEmployers,
  type CareerFairRecord,
  type CareerFairBoothRecord,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

export type CareerFairListItem = CareerFairRecord & {
  boothsCount: number;
  registeredCount: number;
  isRegistered?: boolean;
  registrationId?: string;
};

export type CareerFairDetail = CareerFairRecord & {
  booths: CareerFairBoothRecord[];
  boothsCount: number;
  isRegistered?: boolean;
  registrationId?: string;
  registeredCount: number;
};

export type CareerFairAttendee = {
  registrationId: string;
  fairId: string;
  studentId: string;
  studentName: string;
  studentRegNumber: string;
  studentDepartment: string | null;
  studentLevel: string | null;
  studentAvatarUrl: string | null;
  registeredAt: Date;
  attended: boolean;
  notes: string | null;
};

export type CreateCareerFairInput = {
  title: string;
  theme?: string;
  description: string;
  venue?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  bannerUrl?: string;
  targetAudience?: string;
  status?: "UPCOMING" | "ONGOING" | "CONCLUDED" | "CANCELLED";
  isPublished?: boolean;
};

export type CreateBoothInput = {
  fairId: string;
  companyName: string;
  employerId?: string;
  boothNumber?: string;
  industry?: string;
  websiteUrl?: string;
  targetRoles?: string;
  openPositionsCount?: number;
  virtualMeetingUrl?: string;
  displayOrder?: number;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * List all published career fairs (or all fairs for admin/staff)
 */
export async function listCareerFairsAction(): Promise<CareerFairListItem[]> {
  try {
    const currentUser = await getCurrentUser();
    const isStaffOrAdmin =
      currentUser &&
      (currentUser.role === "SUPER_ADMIN" || currentUser.role === "STAFF");
    const studentProfileId = currentUser?.studentProfile?.id;

    const fairs = isStaffOrAdmin
      ? await db.select().from(careerFairs).orderBy(desc(careerFairs.startDate))
      : await db
          .select()
          .from(careerFairs)
          .where(eq(careerFairs.isPublished, true))
          .orderBy(desc(careerFairs.startDate));

    if (fairs.length === 0) {
      await seedDefaultCareerFair();
      return listCareerFairsAction();
    }

    const result: CareerFairListItem[] = [];

    for (const fair of fairs) {
      const [boothCountRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(careerFairBooths)
        .where(eq(careerFairBooths.fairId, fair.id));

      const [regCountRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(careerFairRegistrations)
        .where(eq(careerFairRegistrations.fairId, fair.id));

      let isRegistered = false;
      let registrationId: string | undefined = undefined;

      if (studentProfileId) {
        const [reg] = await db
          .select({ id: careerFairRegistrations.id })
          .from(careerFairRegistrations)
          .where(
            and(
              eq(careerFairRegistrations.fairId, fair.id),
              eq(careerFairRegistrations.studentId, studentProfileId),
            ),
          )
          .limit(1);

        if (reg) {
          isRegistered = true;
          registrationId = reg.id;
        }
      }

      result.push({
        ...fair,
        boothsCount: boothCountRes?.count || 0,
        registeredCount: regCountRes?.count || 0,
        isRegistered,
        registrationId,
      });
    }

    return result;
  } catch (err) {
    console.error("[listCareerFairsAction] Error:", err);
    return [];
  }
}

/**
 * Get detailed career fair with all employer booths
 */
export async function getCareerFairDetailsAction(
  fairId: string,
): Promise<CareerFairDetail | null> {
  try {
    const currentUser = await getCurrentUser();
    const studentProfileId = currentUser?.studentProfile?.id;

    const [fair] = await db
      .select()
      .from(careerFairs)
      .where(eq(careerFairs.id, fairId))
      .limit(1);

    if (!fair) return null;

    const booths = await db
      .select()
      .from(careerFairBooths)
      .where(eq(careerFairBooths.fairId, fair.id))
      .orderBy(asc(careerFairBooths.displayOrder), asc(careerFairBooths.boothNumber));

    const [regCountRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(careerFairRegistrations)
      .where(eq(careerFairRegistrations.fairId, fair.id));

    let isRegistered = false;
    let registrationId: string | undefined = undefined;

    if (studentProfileId) {
      const [reg] = await db
        .select({ id: careerFairRegistrations.id })
        .from(careerFairRegistrations)
        .where(
          and(
            eq(careerFairRegistrations.fairId, fair.id),
            eq(careerFairRegistrations.studentId, studentProfileId),
          ),
        )
        .limit(1);

      if (reg) {
        isRegistered = true;
        registrationId = reg.id;
      }
    }

    return {
      ...fair,
      booths,
      boothsCount: booths.length,
      isRegistered,
      registrationId,
      registeredCount: regCountRes?.count || 0,
    };
  } catch (err) {
    console.error("[getCareerFairDetailsAction] Error:", err);
    return null;
  }
}

/**
 * Super Admin & Staff: Create Career Fair
 */
export async function createCareerFairAction(
  input: CreateCareerFairInput,
): Promise<{ success: boolean; fairId?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized to create career fairs.");
    }

    if (!input.title?.trim() || !input.description?.trim()) {
      throw new Error("Title and description are required.");
    }

    const baseSlug = slugify(input.title);
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const [inserted] = await db
      .insert(careerFairs)
      .values({
        title: input.title.trim(),
        slug,
        theme: input.theme?.trim() || null,
        description: input.description.trim(),
        venue: input.venue?.trim() || "KSITM Main Convocation Arena & Virtual Livestream",
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        registrationDeadline: input.registrationDeadline
          ? new Date(input.registrationDeadline)
          : null,
        bannerUrl: input.bannerUrl?.trim() || null,
        targetAudience: input.targetAudience?.trim() || "All Students & Alumni",
        status: input.status || "UPCOMING",
        isPublished: input.isPublished !== undefined ? input.isPublished : true,
      })
      .returning();

    await recordAuditLog({
      actorId: currentUser.id,
      action: "CAREER_FAIR_CREATE",
      entityType: "career_fairs",
      entityId: inserted.id,
      details: { title: inserted.title, slug: inserted.slug },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true, fairId: inserted.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create career fair.",
    };
  }
}

/**
 * Super Admin & Staff: Update Career Fair
 */
export async function updateCareerFairAction(
  fairId: string,
  input: Partial<CreateCareerFairInput>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    const patch: Partial<typeof careerFairs.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.theme !== undefined) patch.theme = input.theme?.trim() || null;
    if (input.description !== undefined) patch.description = input.description.trim();
    if (input.venue !== undefined) patch.venue = input.venue.trim();
    if (input.startDate !== undefined) patch.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) patch.endDate = new Date(input.endDate);
    if (input.registrationDeadline !== undefined) {
      patch.registrationDeadline = input.registrationDeadline
        ? new Date(input.registrationDeadline)
        : null;
    }
    if (input.bannerUrl !== undefined) patch.bannerUrl = input.bannerUrl?.trim() || null;
    if (input.targetAudience !== undefined) patch.targetAudience = input.targetAudience.trim();
    if (input.status !== undefined) patch.status = input.status;
    if (input.isPublished !== undefined) patch.isPublished = input.isPublished;

    await db.update(careerFairs).set(patch).where(eq(careerFairs.id, fairId));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "CAREER_FAIR_UPDATE",
      entityType: "career_fairs",
      entityId: fairId,
      details: patch,
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update career fair.",
    };
  }
}

/**
 * Super Admin & Staff: Delete Career Fair
 */
export async function deleteCareerFairAction(
  fairId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    await db.delete(careerFairs).where(eq(careerFairs.id, fairId));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "CAREER_FAIR_DELETE",
      entityType: "career_fairs",
      entityId: fairId,
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete career fair.",
    };
  }
}

/**
 * Super Admin & Staff: Add Booth to Career Fair
 */
export async function addCareerFairBoothAction(
  input: CreateBoothInput,
): Promise<{ success: boolean; boothId?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    if (!input.fairId || !input.companyName?.trim()) {
      throw new Error("Fair ID and company name are required.");
    }

    const [inserted] = await db
      .insert(careerFairBooths)
      .values({
        fairId: input.fairId,
        companyName: input.companyName.trim(),
        employerId: input.employerId || null,
        boothNumber: input.boothNumber?.trim() || "Booth",
        industry: input.industry?.trim() || "Technology",
        websiteUrl: input.websiteUrl?.trim() || null,
        targetRoles: input.targetRoles?.trim() || null,
        openPositionsCount: input.openPositionsCount || 1,
        virtualMeetingUrl: input.virtualMeetingUrl?.trim() || null,
        displayOrder: input.displayOrder || 0,
      })
      .returning();

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true, boothId: inserted.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add booth.",
    };
  }
}

/**
 * Super Admin & Staff: Delete Booth
 */
export async function deleteCareerFairBoothAction(
  boothId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    await db.delete(careerFairBooths).where(eq(careerFairBooths.id, boothId));
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete booth.",
    };
  }
}

/**
 * Student: Register for Career Fair
 */
export async function registerForCareerFairAction(
  fairId: string,
  notes?: string,
): Promise<{ success: boolean; registrationId?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.studentProfile) {
      throw new Error("Student authentication required to register for career fair.");
    }

    const student = currentUser.studentProfile;

    // Check if fair exists and is published
    const [fair] = await db
      .select({ id: careerFairs.id, title: careerFairs.title })
      .from(careerFairs)
      .where(eq(careerFairs.id, fairId))
      .limit(1);

    if (!fair) throw new Error("Career Fair not found.");

    const [existing] = await db
      .select({ id: careerFairRegistrations.id })
      .from(careerFairRegistrations)
      .where(
        and(
          eq(careerFairRegistrations.fairId, fairId),
          eq(careerFairRegistrations.studentId, student.id),
        ),
      )
      .limit(1);

    if (existing) {
      return { success: true, registrationId: existing.id };
    }

    const [inserted] = await db
      .insert(careerFairRegistrations)
      .values({
        fairId,
        studentId: student.id,
        registrationNumber: student.regNumber,
        notes: notes?.trim() || null,
        attended: false,
      })
      .returning();

    await recordAuditLog({
      actorId: currentUser.id,
      action: "CAREER_FAIR_REGISTER",
      entityType: "career_fair_registrations",
      entityId: inserted.id,
      details: { fairTitle: fair.title, studentReg: student.regNumber },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { success: true, registrationId: inserted.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to register for career fair.",
    };
  }
}

/**
 * Student: Cancel Career Fair Registration
 */
export async function cancelCareerFairRegistrationAction(
  fairId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.studentProfile) {
      throw new Error("Unauthorized.");
    }

    await db
      .delete(careerFairRegistrations)
      .where(
        and(
          eq(careerFairRegistrations.fairId, fairId),
          eq(careerFairRegistrations.studentId, currentUser.studentProfile.id),
        ),
      );

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel registration.",
    };
  }
}

/**
 * Super Admin & Staff: List Attendees for a Fair
 */
export async function listCareerFairAttendeesAction(
  fairId: string,
): Promise<CareerFairAttendee[]> {
  try {
    const rows = await db
      .select({
        registrationId: careerFairRegistrations.id,
        fairId: careerFairRegistrations.fairId,
        studentId: careerFairRegistrations.studentId,
        registeredAt: careerFairRegistrations.registeredAt,
        attended: careerFairRegistrations.attended,
        notes: careerFairRegistrations.notes,
        studentName: studentProfiles.fullName,
        studentRegNumber: studentProfiles.regNumber,
        studentDepartment: studentProfiles.department,
        studentLevel: studentProfiles.level,
        studentAvatarUrl: studentProfiles.avatarUrl,
      })
      .from(careerFairRegistrations)
      .innerJoin(
        studentProfiles,
        eq(careerFairRegistrations.studentId, studentProfiles.id),
      )
      .where(eq(careerFairRegistrations.fairId, fairId))
      .orderBy(desc(careerFairRegistrations.registeredAt));

    return rows;
  } catch (err) {
    console.error("[listCareerFairAttendeesAction] Error:", err);
    return [];
  }
}

/**
 * Super Admin & Staff: Mark attendance
 */
export async function markCareerFairAttendanceAction(
  registrationId: string,
  attended: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    await db
      .update(careerFairRegistrations)
      .set({ attended })
      .where(eq(careerFairRegistrations.id, registrationId));

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update attendance.",
    };
  }
}

/**
 * Internal seed function for default Career Fair
 */
async function seedDefaultCareerFair() {
  try {
    const [existing] = await db.select({ id: careerFairs.id }).from(careerFairs).limit(1);
    if (existing) return;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14); // 2 weeks from now
    startDate.setHours(9, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(17, 0, 0, 0);

    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() - 2);

    const [fair] = await db
      .insert(careerFairs)
      .values({
        title: "KSITM Annual Technology & Innovation Career Fair 2026",
        slug: "ksitm-tech-innovation-career-fair-2026",
        theme: "Bridging Katsina's Tech Talent with Global Industry Opportunities",
        description:
          "The premier institutional recruitment expo uniting forward-thinking employers, venture partners, and leading tech companies with KSITM scholars across Computer Science, Software Engineering, Networking, and FinTech. Features direct interviews, technical resume drop-offs, and speed networking.",
        venue: "KSITM Convocation Arena & Virtual Hybrid Booths",
        startDate,
        endDate,
        registrationDeadline: deadline,
        bannerUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
        targetAudience: "All ND, HND Scholars, Alumni, and Industry Leaders",
        status: "UPCOMING",
        isPublished: true,
      })
      .returning();

    // Find partner employers to associate with booths
    const employers = await db.select().from(partnerEmployers).limit(5);

    const defaultBooths = [
      {
        fairId: fair.id,
        employerId: employers[0]?.id || null,
        companyName: employers[0]?.name || "KSITM Digital Innovations",
        boothNumber: "Booth A-01 (Flagship)",
        industry: "Software Engineering & Cloud Infrastructure",
        targetRoles: "Full-Stack Engineers, DevOps Interns, QA Analysts",
        openPositionsCount: 6,
        displayOrder: 1,
      },
      {
        fairId: fair.id,
        employerId: null,
        companyName: "Katsina State ICT Directorate",
        boothNumber: "Booth A-02",
        industry: "Public Sector Digital Infrastructure",
        targetRoles: "Network Engineers, Cyber Analysts, Database Admins",
        openPositionsCount: 4,
        displayOrder: 2,
      },
      {
        fairId: fair.id,
        employerId: null,
        companyName: "FinTech Sahara Solutions",
        boothNumber: "Booth B-01",
        industry: "Banking Operations & FinTech",
        targetRoles: "Backend Developers, Data Analytics Fellows",
        openPositionsCount: 3,
        displayOrder: 3,
      },
    ];

    for (const b of defaultBooths) {
      await db.insert(careerFairBooths).values(b);
    }
  } catch (err) {
    console.error("Failed to seed default career fair:", err);
  }
}
