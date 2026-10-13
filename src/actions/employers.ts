"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  partnerEmployers,
  jobPostings,
  jobRecommendations,
  studentProfiles,
  staffProfiles,
  users,
  type PartnerEmployerRecord,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { listJobPostingsAction, type JobPostingItem } from "@/actions/jobs";

export type PartnerEmployerItem = PartnerEmployerRecord & {
  activeJobsCount: number;
  placementsCount: number;
  loginEmail?: string | null;
  hasLoginAccount: boolean;
};

export type OnboardEmployerInput = {
  name: string;
  industry: string;
  partnershipTier: "STRATEGIC" | "MOA_SIGNED" | "RECRUITING_PARTNER" | "AFFILIATE";
  registrationNumber?: string;
  officialEmail?: string;
  contactPerson?: string;
  contactDesignation?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  websiteUrl?: string;
  logoUrl?: string;
  description?: string;
  verificationStatus?: "PENDING" | "VERIFIED" | "SUSPENDED";
  trustBadges?: string[];
  isActive?: boolean;
  createLoginAccount?: boolean;
  loginEmail?: string;
  loginPassword?: string;
};

export type JobRecommendationRow = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  natureOfWork: string;
  duration: string;
  studentId: string;
  studentName: string;
  studentRegNumber: string;
  studentDepartment: string | null;
  studentLevel: string | null;
  studentAvatarUrl: string | null;
  recommendedByUserId: string | null;
  recommenderName: string;
  recommenderDesignation: string | null;
  recommendationReason: string;
  supervisorUserId: string | null;
  supervisorName: string | null;
  status: "RECOMMENDED" | "APPLIED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED";
  supervisionNotes: string | null;
  statusUpdateReason: string | null;
  employerFeedback?: string | null;
  employerStatus?: string | null;
  startDate: Date | null;
  endDate: Date | null;
  performanceRating: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EmployerRecommendationItem = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  natureOfWork: string;
  duration: string;
  studentId: string;
  studentName: string;
  studentRegNumber: string;
  studentDepartment: string | null;
  studentLevel: string | null;
  studentAvatarUrl: string | null;
  studentEmail: string | null;
  studentPhone: string | null;
  recommendedByUserId: string | null;
  recommenderName: string;
  recommenderDesignation: string | null;
  recommenderEmail: string | null;
  recommendationReason: string;
  supervisorUserId: string | null;
  supervisorName: string | null;
  status: "RECOMMENDED" | "APPLIED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED";
  supervisionNotes: string | null;
  employerFeedback: string | null;
  employerStatus: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
 * List all partner corporate and institutional employers with trust & account stats
 */
export async function listPartnerEmployersAction(filter?: {
  search?: string;
  industry?: string;
  partnershipTier?: string;
  verificationStatus?: string;
}): Promise<PartnerEmployerItem[]> {
  const conditions = [];

  if (filter?.industry && filter.industry !== "ALL") {
    conditions.push(eq(partnerEmployers.industry, filter.industry));
  }
  if (filter?.partnershipTier && filter.partnershipTier !== "ALL") {
    conditions.push(eq(partnerEmployers.partnershipTier, filter.partnershipTier as never));
  }
  if (filter?.verificationStatus && filter.verificationStatus !== "ALL") {
    conditions.push(eq(partnerEmployers.verificationStatus, filter.verificationStatus as never));
  }
  if (filter?.search?.trim()) {
    const pattern = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(partnerEmployers.name, pattern),
        ilike(partnerEmployers.industry, pattern),
        ilike(partnerEmployers.contactPerson, pattern),
        ilike(partnerEmployers.registrationNumber, pattern),
        ilike(partnerEmployers.officialEmail, pattern),
      ),
    );
  }

  const rows = await db
    .select({
      id: partnerEmployers.id,
      name: partnerEmployers.name,
      slug: partnerEmployers.slug,
      industry: partnerEmployers.industry,
      partnershipTier: partnerEmployers.partnershipTier,
      contactPerson: partnerEmployers.contactPerson,
      contactDesignation: partnerEmployers.contactDesignation,
      contactEmail: partnerEmployers.contactEmail,
      contactPhone: partnerEmployers.contactPhone,
      officialEmail: partnerEmployers.officialEmail,
      registrationNumber: partnerEmployers.registrationNumber,
      userId: partnerEmployers.userId,
      verificationStatus: partnerEmployers.verificationStatus,
      verifiedAt: partnerEmployers.verifiedAt,
      verifiedByUserId: partnerEmployers.verifiedByUserId,
      trustBadges: partnerEmployers.trustBadges,
      address: partnerEmployers.address,
      websiteUrl: partnerEmployers.websiteUrl,
      logoUrl: partnerEmployers.logoUrl,
      description: partnerEmployers.description,
      isActive: partnerEmployers.isActive,
      createdAt: partnerEmployers.createdAt,
      updatedAt: partnerEmployers.updatedAt,
      loginEmail: users.email,
    })
    .from(partnerEmployers)
    .leftJoin(users, eq(partnerEmployers.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(partnerEmployers.createdAt));

  const jobCounts = await db
    .select({
      employerId: jobPostings.employerId,
      count: sql<number>`count(*)::int`,
    })
    .from(jobPostings)
    .groupBy(jobPostings.employerId);

  const countMap = new Map<string, number>();
  for (const c of jobCounts) {
    if (c.employerId) countMap.set(c.employerId, c.count);
  }

  const recCounts = await db
    .select({
      employerId: jobPostings.employerId,
      count: sql<number>`count(*)::int`,
    })
    .from(jobRecommendations)
    .innerJoin(jobPostings, eq(jobRecommendations.jobId, jobPostings.id))
    .groupBy(jobPostings.employerId);

  const recMap = new Map<string, number>();
  for (const r of recCounts) {
    if (r.employerId) recMap.set(r.employerId, r.count);
  }

  return rows.map((r) => ({
    ...r,
    activeJobsCount: countMap.get(r.id) || 0,
    placementsCount: recMap.get(r.id) || 0,
    hasLoginAccount: Boolean(r.userId && r.loginEmail),
  }));
}

/**
 * Super Admin: Onboard a trusted employer with full compliance and optional dashboard login credentials
 */
export async function onboardPartnerEmployerAction(
  input: OnboardEmployerInput,
): Promise<{ success: boolean; employerId?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    if (!input.name.trim()) throw new Error("Employer organization name is required.");

    const baseSlug = slugify(input.name);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await db
        .select({ id: partnerEmployers.id })
        .from(partnerEmployers)
        .where(eq(partnerEmployers.slug, uniqueSlug))
        .limit(1);
      if (!existing) break;
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    let createdUserId: string | null = null;

    if (input.createLoginAccount && input.loginEmail?.trim() && input.loginPassword?.trim()) {
      const loginEmail = input.loginEmail.trim().toLowerCase();
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = lower(${loginEmail})`)
        .limit(1);

      if (existingUser) {
        throw new Error(`A user account with email "${loginEmail}" already exists.`);
      }

      const passwordHash = await hashPassword(input.loginPassword.trim());
      const [newUser] = await db
        .insert(users)
        .values({
          email: loginEmail,
          passwordHash,
          role: "EMPLOYER",
          isActive: true,
        })
        .returning({ id: users.id });

      createdUserId = newUser.id;
    }

    const defaultBadges = [
      input.registrationNumber ? "CAC Registered" : "Identity Verified",
      input.partnershipTier === "STRATEGIC"
        ? "Strategic Partner"
        : input.partnershipTier === "MOA_SIGNED"
          ? "MOA Partner"
          : "Verified Recruiter",
    ];

    const badges = input.trustBadges && input.trustBadges.length > 0
      ? input.trustBadges
      : defaultBadges;

    const [inserted] = await db
      .insert(partnerEmployers)
      .values({
        name: input.name.trim(),
        slug: uniqueSlug,
        industry: input.industry.trim() || "Technology",
        partnershipTier: input.partnershipTier || "RECRUITING_PARTNER",
        registrationNumber: input.registrationNumber?.trim() || null,
        officialEmail: input.officialEmail?.trim() || null,
        contactPerson: input.contactPerson?.trim() || null,
        contactDesignation: input.contactDesignation?.trim() || null,
        contactEmail: input.contactEmail?.trim() || null,
        contactPhone: input.contactPhone?.trim() || null,
        userId: createdUserId,
        verificationStatus: input.verificationStatus || "VERIFIED",
        verifiedAt: new Date(),
        verifiedByUserId: currentUser.id,
        trustBadges: badges,
        address: input.address?.trim() || null,
        websiteUrl: input.websiteUrl?.trim() || null,
        logoUrl: input.logoUrl?.trim() || null,
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
      })
      .returning({ id: partnerEmployers.id });

    await recordAuditLog({
      actorId: currentUser.id,
      action: "PARTNER_EMPLOYER_ONBOARD",
      entityType: "partner_employers",
      entityId: inserted.id,
      details: {
        name: input.name,
        tier: input.partnershipTier,
        hasAccount: Boolean(createdUserId),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/staff");
    return { success: true, employerId: inserted.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to onboard partner employer.",
    };
  }
}

/**
 * Super Admin & Staff: Update existing partner employer organization
 */
export async function updatePartnerEmployerAction(
  id: string,
  input: Partial<OnboardEmployerInput>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    await db
      .update(partnerEmployers)
      .set({
        name: input.name ? input.name.trim() : undefined,
        industry: input.industry ? input.industry.trim() : undefined,
        partnershipTier: input.partnershipTier,
        registrationNumber: input.registrationNumber !== undefined ? input.registrationNumber : undefined,
        officialEmail: input.officialEmail !== undefined ? input.officialEmail : undefined,
        contactPerson: input.contactPerson !== undefined ? input.contactPerson : undefined,
        contactDesignation: input.contactDesignation !== undefined ? input.contactDesignation : undefined,
        contactEmail: input.contactEmail !== undefined ? input.contactEmail : undefined,
        contactPhone: input.contactPhone !== undefined ? input.contactPhone : undefined,
        verificationStatus: input.verificationStatus !== undefined ? input.verificationStatus : undefined,
        trustBadges: input.trustBadges !== undefined ? input.trustBadges : undefined,
        address: input.address !== undefined ? input.address : undefined,
        websiteUrl: input.websiteUrl !== undefined ? input.websiteUrl : undefined,
        logoUrl: input.logoUrl !== undefined ? input.logoUrl : undefined,
        description: input.description !== undefined ? input.description : undefined,
        isActive: input.isActive !== undefined ? input.isActive : undefined,
        updatedAt: new Date(),
      })
      .where(eq(partnerEmployers.id, id));

    revalidatePath("/admin");
    revalidatePath("/staff");
    revalidatePath("/employer");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update partner employer.",
    };
  }
}

/**
 * Super Admin: Create or reset employer dashboard login credentials
 */
export async function createOrResetEmployerLoginAction(
  employerId: string,
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      throw new Error("Super Admin authorization required to manage employer credentials.");
    }

    if (!email.trim() || !password.trim()) {
      throw new Error("Both email and password are required.");
    }

    const [employer] = await db
      .select()
      .from(partnerEmployers)
      .where(eq(partnerEmployers.id, employerId))
      .limit(1);

    if (!employer) throw new Error("Employer organization not found.");

    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = await hashPassword(password.trim());

    if (employer.userId) {
      await db
        .update(users)
        .set({
          email: cleanEmail,
          passwordHash,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, employer.userId));
    } else {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = lower(${cleanEmail})`)
        .limit(1);

      if (existingUser) {
        throw new Error(`Email "${cleanEmail}" is already used by another account.`);
      }

      const [newUser] = await db
        .insert(users)
        .values({
          email: cleanEmail,
          passwordHash,
          role: "EMPLOYER",
          isActive: true,
        })
        .returning({ id: users.id });

      await db
        .update(partnerEmployers)
        .set({ userId: newUser.id, updatedAt: new Date() })
        .where(eq(partnerEmployers.id, employerId));
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "EMPLOYER_CREDENTIALS_RESET",
      entityType: "partner_employers",
      entityId: employerId,
      details: { email: cleanEmail },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to set employer credentials.",
    };
  }
}

/**
 * Super Admin: Update trust verification status and badges
 */
export async function updateEmployerTrustStatusAction(
  employerId: string,
  input: {
    verificationStatus: "PENDING" | "VERIFIED" | "SUSPENDED";
    trustBadges?: string[];
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      throw new Error("Super Admin authorization required.");
    }

    await db
      .update(partnerEmployers)
      .set({
        verificationStatus: input.verificationStatus,
        trustBadges: input.trustBadges !== undefined ? input.trustBadges : undefined,
        verifiedAt: input.verificationStatus === "VERIFIED" ? new Date() : undefined,
        verifiedByUserId: input.verificationStatus === "VERIFIED" ? currentUser.id : undefined,
        updatedAt: new Date(),
      })
      .where(eq(partnerEmployers.id, employerId));

    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update employer trust status.",
    };
  }
}

/**
 * Delete partner employer
 */
export async function deletePartnerEmployerAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    await db.delete(partnerEmployers).where(eq(partnerEmployers.id, id));
    revalidatePath("/admin");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete partner employer.",
    };
  }
}

/**
 * Seed realistic partner employers with verifiable profiles and login accounts
 */
export async function seedStandardEmployersAction(): Promise<{
  success: boolean;
  seededCount: number;
}> {
  try {
    const existing = await db.select({ id: partnerEmployers.id }).from(partnerEmployers).limit(1);
    if (existing.length > 0) return { success: true, seededCount: 0 };

    const employers: OnboardEmployerInput[] = [
      {
        name: "Katsina State ICT Directorate",
        industry: "Public Sector & Digital Infrastructure",
        partnershipTier: "STRATEGIC",
        registrationNumber: "KTG-ICT-2024",
        officialEmail: "employer1@ksitmcareers.gov.ng",
        contactPerson: "Engr. Aliyu Sanusi",
        contactDesignation: "Director of Digital Services & Training",
        contactEmail: "employer1@ksitmcareers.gov.ng",
        contactPhone: "+234 803 200 4500",
        address: "State Secretariat Complex, Katsina, Katsina State",
        websiteUrl: "https://katsina.gov.ng",
        description:
          "Official state technology agency driving e-governance infrastructure, government cloud networks, and strategic technical internship pipelines for KSITM technology graduates.",
        verificationStatus: "VERIFIED",
        trustBadges: [
          "State Government Agency",
          "Official MOA Signed",
          "Public Sector Sponsor",
          "CAC Verified",
        ],
        createLoginAccount: true,
        loginEmail: "employer1@ksitmcareers.gov.ng",
        loginPassword: "Password123!",
      },
    ];

    let seededCount = 0;
    for (const emp of employers) {
      const res = await onboardPartnerEmployerAction(emp);
      if (res.success) seededCount++;
    }

    return { success: true, seededCount };
  } catch (err) {
    console.error("Failed to seed employers:", err);
    return { success: false, seededCount: 0 };
  }
}

/**
 * Career Staff: Recommend a job to a registered student
 */
export async function recommendJobToStudentAction(input: {
  jobId: string;
  studentId: string;
  recommendationReason: string;
  supervisorUserId?: string;
}): Promise<{ success: boolean; recommendationId?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized. Only Career Staff and Administrators can recommend jobs.");
    }

    if (!input.jobId || !input.studentId) {
      throw new Error("Both job ID and student ID are required.");
    }
    if (!input.recommendationReason?.trim()) {
      throw new Error("Please provide a recommendation rationale explaining why this student is matched.");
    }

    const [job] = await db
      .select({ id: jobPostings.id, title: jobPostings.title, companyName: jobPostings.companyName })
      .from(jobPostings)
      .where(eq(jobPostings.id, input.jobId))
      .limit(1);
    if (!job) throw new Error("Job posting not found.");

    const [student] = await db
      .select({ id: studentProfiles.id, fullName: studentProfiles.fullName, regNumber: studentProfiles.regNumber })
      .from(studentProfiles)
      .where(eq(studentProfiles.id, input.studentId))
      .limit(1);
    if (!student) throw new Error("Student record not found.");

    let recommenderName = "Career Services Advisor";
    let recommenderDesignation = "Advisory Staff";
    const [staff] = await db
      .select({ fullName: staffProfiles.fullName, designation: staffProfiles.designation })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, currentUser.id))
      .limit(1);
    if (staff) {
      recommenderName = staff.fullName;
      recommenderDesignation = staff.designation || "Career Staff";
    } else if (currentUser.role === "SUPER_ADMIN") {
      recommenderName = "Super Administrator";
      recommenderDesignation = "Career Services Central";
    }

    let supervisorName = recommenderName;
    const supervisorId = input.supervisorUserId || currentUser.id;
    if (supervisorId !== currentUser.id) {
      const [sup] = await db
        .select({ fullName: staffProfiles.fullName })
        .from(staffProfiles)
        .where(eq(staffProfiles.userId, supervisorId))
        .limit(1);
      if (sup) supervisorName = sup.fullName;
    }

    const [existing] = await db
      .select({ id: jobRecommendations.id })
      .from(jobRecommendations)
      .where(
        and(
          eq(jobRecommendations.jobId, input.jobId),
          eq(jobRecommendations.studentId, input.studentId),
        ),
      )
      .limit(1);

    if (existing) {
      throw new Error("This student has already been recommended for this job posting.");
    }

    const [inserted] = await db
      .insert(jobRecommendations)
      .values({
        jobId: input.jobId,
        studentId: input.studentId,
        recommendedByUserId: currentUser.id,
        recommenderName,
        recommenderDesignation,
        recommendationReason: input.recommendationReason.trim(),
        supervisorUserId: supervisorId,
        supervisorName,
        status: "RECOMMENDED",
        supervisionNotes: `Recommended by ${recommenderName} on ${new Date().toLocaleDateString()}. Initial status: Recommended to student and employer.`,
      })
      .returning({ id: jobRecommendations.id });

    await recordAuditLog({
      actorId: currentUser.id,
      action: "JOB_RECOMMENDATION_CREATE",
      entityType: "job_recommendations",
      entityId: inserted.id,
      details: {
        studentName: student.fullName,
        jobTitle: job.title,
        company: job.companyName,
        reason: input.recommendationReason,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/staff");
    revalidatePath("/dashboard");
    revalidatePath("/employer");
    return { success: true, recommendationId: inserted.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to recommend job to student.",
    };
  }
}

/**
 * Career Staff: Update recommendation rationale ("why he is making the recommendation")
 */
export async function updateRecommendationReasonAction(
  recommendationId: string,
  newReason: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    if (!newReason.trim()) throw new Error("Recommendation reason cannot be empty.");

    await db
      .update(jobRecommendations)
      .set({
        recommendationReason: newReason.trim(),
        updatedAt: new Date(),
      })
      .where(eq(jobRecommendations.id, recommendationId));

    revalidatePath("/admin");
    revalidatePath("/staff");
    revalidatePath("/dashboard");
    revalidatePath("/employer");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update recommendation reason.",
    };
  }
}

/**
 * Career Staff: Supervise the job and update engagement status
 */
export async function updateJobSupervisionStatusAction(
  recommendationId: string,
  input: {
    status: "RECOMMENDED" | "APPLIED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED";
    supervisionNotes?: string;
    statusUpdateReason?: string;
    startDate?: Date;
    endDate?: Date;
    performanceRating?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
      throw new Error("Unauthorized.");
    }

    const [rec] = await db
      .select()
      .from(jobRecommendations)
      .where(eq(jobRecommendations.id, recommendationId))
      .limit(1);

    if (!rec) throw new Error("Recommendation record not found.");

    const existingNotes = rec.supervisionNotes || "";
    const timestampHeader = `\n[${new Date().toLocaleDateString()} - Status: ${input.status}]`;
    const newNoteEntry = input.supervisionNotes ? `${timestampHeader} ${input.supervisionNotes}` : "";
    const combinedNotes = `${existingNotes}${newNoteEntry}`.trim();

    await db
      .update(jobRecommendations)
      .set({
        status: input.status,
        supervisionNotes: combinedNotes || rec.supervisionNotes,
        statusUpdateReason: input.statusUpdateReason?.trim() || rec.statusUpdateReason,
        startDate: input.startDate || (input.status === "IN_PROGRESS" && !rec.startDate ? new Date() : rec.startDate),
        endDate: input.endDate || (input.status === "COMPLETED" || input.status === "TERMINATED" ? new Date() : rec.endDate),
        performanceRating: input.performanceRating !== undefined ? input.performanceRating : rec.performanceRating,
        updatedAt: new Date(),
      })
      .where(eq(jobRecommendations.id, recommendationId));

    await recordAuditLog({
      actorId: currentUser.id,
      action: "JOB_SUPERVISION_STATUS_UPDATE",
      entityType: "job_recommendations",
      entityId: recommendationId,
      details: { newStatus: input.status, reason: input.statusUpdateReason },
    });

    revalidatePath("/admin");
    revalidatePath("/staff");
    revalidatePath("/dashboard");
    revalidatePath("/employer");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update supervision status.",
    };
  }
}

/**
 * List all recommendations & supervision records (Who recommended who to who)
 */
export async function listJobRecommendationsAction(filter?: {
  jobId?: string;
  studentId?: string;
  supervisorUserId?: string;
  status?: string;
  search?: string;
}): Promise<JobRecommendationRow[]> {
  const conditions = [];

  if (filter?.jobId && filter.jobId !== "ALL") {
    conditions.push(eq(jobRecommendations.jobId, filter.jobId));
  }
  if (filter?.studentId) {
    conditions.push(eq(jobRecommendations.studentId, filter.studentId));
  }
  if (filter?.supervisorUserId) {
    conditions.push(eq(jobRecommendations.supervisorUserId, filter.supervisorUserId));
  }
  if (filter?.status && filter.status !== "ALL") {
    conditions.push(eq(jobRecommendations.status, filter.status as never));
  }
  if (filter?.search?.trim()) {
    const pattern = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        ilike(studentProfiles.fullName, pattern),
        ilike(studentProfiles.regNumber, pattern),
        ilike(jobPostings.title, pattern),
        ilike(jobPostings.companyName, pattern),
        ilike(jobRecommendations.recommenderName, pattern),
      ),
    );
  }

  const rows = await db
    .select({
      id: jobRecommendations.id,
      jobId: jobRecommendations.jobId,
      jobTitle: jobPostings.title,
      companyName: jobPostings.companyName,
      natureOfWork: jobPostings.natureOfWork,
      duration: jobPostings.duration,
      studentId: jobRecommendations.studentId,
      studentName: studentProfiles.fullName,
      studentRegNumber: studentProfiles.regNumber,
      studentDepartment: studentProfiles.department,
      studentLevel: studentProfiles.level,
      studentAvatarUrl: studentProfiles.avatarUrl,
      recommendedByUserId: jobRecommendations.recommendedByUserId,
      recommenderName: jobRecommendations.recommenderName,
      recommenderDesignation: jobRecommendations.recommenderDesignation,
      recommendationReason: jobRecommendations.recommendationReason,
      supervisorUserId: jobRecommendations.supervisorUserId,
      supervisorName: jobRecommendations.supervisorName,
      status: jobRecommendations.status,
      supervisionNotes: jobRecommendations.supervisionNotes,
      statusUpdateReason: jobRecommendations.statusUpdateReason,
      employerFeedback: jobRecommendations.employerFeedback,
      employerStatus: jobRecommendations.employerStatus,
      startDate: jobRecommendations.startDate,
      endDate: jobRecommendations.endDate,
      performanceRating: jobRecommendations.performanceRating,
      createdAt: jobRecommendations.createdAt,
      updatedAt: jobRecommendations.updatedAt,
    })
    .from(jobRecommendations)
    .innerJoin(jobPostings, eq(jobRecommendations.jobId, jobPostings.id))
    .innerJoin(studentProfiles, eq(jobRecommendations.studentId, studentProfiles.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(jobRecommendations.updatedAt));

  return rows as JobRecommendationRow[];
}

/**
 * Student: Get personal recommended jobs with advisor notes and supervision status
 */
export async function getMyRecommendedJobsAction(): Promise<{
  success: boolean;
  recommendations: JobRecommendationRow[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.studentProfile) {
      throw new Error("Student authentication required.");
    }

    const rows = await listJobRecommendationsAction({
      studentId: currentUser.studentProfile.id,
    });

    return { success: true, recommendations: rows };
  } catch (err: unknown) {
    return {
      success: false,
      recommendations: [],
      error: err instanceof Error ? err.message : "Failed to load recommended jobs.",
    };
  }
}

/**
 * Student: Mark recommended job as applied
 */
export async function markStudentAppliedAction(
  recommendationId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "STUDENT" || !currentUser.studentProfile) {
      throw new Error("Student authentication required.");
    }

    const [rec] = await db
      .select()
      .from(jobRecommendations)
      .where(
        and(
          eq(jobRecommendations.id, recommendationId),
          eq(jobRecommendations.studentId, currentUser.studentProfile.id),
        ),
      )
      .limit(1);

    if (!rec) throw new Error("Recommendation record not found or not assigned to you.");

    const existingNotes = rec.supervisionNotes || "";
    const noteEntry = `\n[${new Date().toLocaleDateString()}] Student reported application submitted.`;

    await db
      .update(jobRecommendations)
      .set({
        status: "APPLIED",
        supervisionNotes: `${existingNotes}${noteEntry}`.trim(),
        updatedAt: new Date(),
      })
      .where(eq(jobRecommendations.id, recommendationId));

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/staff");
    revalidatePath("/employer");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record application status.",
    };
  }
}

/**
 * Employer Portal: Fetch logged-in employer's organization, job postings and candidate recommendations
 */
export async function getEmployerPortalDataAction(): Promise<{
  success: boolean;
  employer?: PartnerEmployerRecord;
  jobs: JobPostingItem[];
  recommendations: EmployerRecommendationItem[];
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "EMPLOYER") {
      throw new Error("Employer authentication required.");
    }

    const [employer] = await db
      .select()
      .from(partnerEmployers)
      .where(eq(partnerEmployers.userId, currentUser.id))
      .limit(1);

    if (!employer) {
      throw new Error(
        "No verified partner organization is linked to your employer account. Please contact KSITM Career Services.",
      );
    }

    const jobs = await listJobPostingsAction({ employerId: employer.id });

    const recommenderUsers = alias(users, "recommender_users");

    const recs = await db
      .select({
        id: jobRecommendations.id,
        jobId: jobRecommendations.jobId,
        jobTitle: jobPostings.title,
        companyName: jobPostings.companyName,
        natureOfWork: jobPostings.natureOfWork,
        duration: jobPostings.duration,
        studentId: jobRecommendations.studentId,
        studentName: studentProfiles.fullName,
        studentRegNumber: studentProfiles.regNumber,
        studentDepartment: studentProfiles.department,
        studentLevel: studentProfiles.level,
        studentAvatarUrl: studentProfiles.avatarUrl,
        studentEmail: users.email,
        studentPhone: studentProfiles.phone,
        recommendedByUserId: jobRecommendations.recommendedByUserId,
        recommenderName: jobRecommendations.recommenderName,
        recommenderDesignation: jobRecommendations.recommenderDesignation,
        recommenderEmail: recommenderUsers.email,
        recommendationReason: jobRecommendations.recommendationReason,
        supervisorUserId: jobRecommendations.supervisorUserId,
        supervisorName: jobRecommendations.supervisorName,
        status: jobRecommendations.status,
        supervisionNotes: jobRecommendations.supervisionNotes,
        employerFeedback: jobRecommendations.employerFeedback,
        employerStatus: jobRecommendations.employerStatus,
        startDate: jobRecommendations.startDate,
        endDate: jobRecommendations.endDate,
        createdAt: jobRecommendations.createdAt,
        updatedAt: jobRecommendations.updatedAt,
      })
      .from(jobRecommendations)
      .innerJoin(jobPostings, eq(jobRecommendations.jobId, jobPostings.id))
      .innerJoin(studentProfiles, eq(jobRecommendations.studentId, studentProfiles.id))
      .leftJoin(users, eq(studentProfiles.userId, users.id))
      .leftJoin(
        recommenderUsers,
        eq(jobRecommendations.recommendedByUserId, recommenderUsers.id),
      )
      .where(eq(jobPostings.employerId, employer.id))
      .orderBy(desc(jobRecommendations.updatedAt));

    return {
      success: true,
      employer,
      jobs,
      recommendations: recs as EmployerRecommendationItem[],
    };
  } catch (err: unknown) {
    return {
      success: false,
      jobs: [],
      recommendations: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to load employer portal dashboard data.",
    };
  }
}

/**
 * Employer Portal: Update feedback and candidate review status for a recommended student
 */
export async function employerUpdateRecommendationStatusAction(
  recommendationId: string,
  input: {
    employerStatus: string;
    employerFeedback?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "EMPLOYER") {
      throw new Error("Employer authentication required.");
    }

    const [employer] = await db
      .select({ id: partnerEmployers.id, name: partnerEmployers.name })
      .from(partnerEmployers)
      .where(eq(partnerEmployers.userId, currentUser.id))
      .limit(1);

    if (!employer) throw new Error("Employer organization not found.");

    const [rec] = await db
      .select({
        id: jobRecommendations.id,
        jobId: jobRecommendations.jobId,
        employerId: jobPostings.employerId,
        supervisionNotes: jobRecommendations.supervisionNotes,
      })
      .from(jobRecommendations)
      .innerJoin(jobPostings, eq(jobRecommendations.jobId, jobPostings.id))
      .where(eq(jobRecommendations.id, recommendationId))
      .limit(1);

    if (!rec || rec.employerId !== employer.id) {
      throw new Error("You are not authorized to update this candidate recommendation.");
    }

    const existingNotes = rec.supervisionNotes || "";
    const stamp = `\n[${new Date().toLocaleDateString()} - Employer Note from ${employer.name}: Status: ${input.employerStatus}]`;
    const noteEntry = input.employerFeedback ? `${stamp} Note: ${input.employerFeedback}` : stamp;

    await db
      .update(jobRecommendations)
      .set({
        employerStatus: input.employerStatus,
        employerFeedback: input.employerFeedback?.trim() || null,
        supervisionNotes: `${existingNotes}${noteEntry}`.trim(),
        updatedAt: new Date(),
      })
      .where(eq(jobRecommendations.id, recommendationId));

    revalidatePath("/employer");
    revalidatePath("/admin");
    revalidatePath("/staff");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record employer feedback.",
    };
  }
}
