"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  employabilityResources,
  staffProfiles,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

export type EmployabilityResourceItem = {
  id: string;
  title: string;
  category: string;
  resourceType: string;
  resourceAddress: string;
  uploaderUserId: string | null;
  uploaderName: string;
  uploaderRole: string;
  uploaderAvatarUrl: string | null;
  uploaderBio: string | null;
  uploaderLinkedIn: string | null;
  whyShared: string;
  howToUse: string;
  targetAudience: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
};


/**
 * List all employability resources.
 * Super admin & staff see drafts and published; students see published only.
 */
export async function listEmployabilityResourcesAction(): Promise<EmployabilityResourceItem[]> {
  const currentUser = await getCurrentUser();
  const isPrivileged = currentUser && (currentUser.role === "SUPER_ADMIN" || currentUser.role === "STAFF");

  const query = db
    .select()
    .from(employabilityResources)
    .orderBy(desc(employabilityResources.createdAt));

  const rows = isPrivileged
    ? await query
    : await query.where(eq(employabilityResources.isPublished, true));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    resourceType: r.resourceType,
    resourceAddress: r.resourceAddress,
    uploaderUserId: r.uploaderUserId,
    uploaderName: r.uploaderName,
    uploaderRole: r.uploaderRole,
    uploaderAvatarUrl: r.uploaderAvatarUrl,
    uploaderBio: r.uploaderBio,
    uploaderLinkedIn: r.uploaderLinkedIn,
    whyShared: r.whyShared,
    howToUse: r.howToUse,
    targetAudience: r.targetAudience,
    isPublished: r.isPublished,
    viewCount: r.viewCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Super Admin & Staff: Create a new educational resource
 */
export async function createEmployabilityResourceAction(data: {
  title: string;
  category: string;
  resourceType?: string;
  resourceAddress: string;
  whyShared: string;
  howToUse: string;
  targetAudience?: string;
  isPublished?: boolean;
  customUploaderName?: string;
  customUploaderRole?: string;
  customUploaderAvatar?: string;
  customUploaderBio?: string;
  customUploaderLinkedIn?: string;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    return { success: false, error: "Unauthorized. Staff or Admin privileges required." };
  }

  if (!data.title?.trim() || data.title.trim().length < 3) {
    return { success: false, error: "Resource title must be at least 3 characters long." };
  }
  if (!data.resourceAddress?.trim()) {
    return { success: false, error: "A valid file share URL, document link, or web address is required." };
  }
  if (!data.whyShared?.trim()) {
    return { success: false, error: "Please explain why you shared this resource (Context & Rationale)." };
  }
  if (!data.howToUse?.trim()) {
    return { success: false, error: "Please provide actionable instructions on how students should use this resource." };
  }

  // Uploader link validation (supports all URLs)
  const candidateLinkedIn = data.customUploaderLinkedIn?.trim();
  if (candidateLinkedIn) {
    try {
      const parsed = new URL(candidateLinkedIn);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return {
          success: false,
          error: "Uploader profile / web link must start with http:// or https://",
        };
      }
    } catch {
      return {
        success: false,
        error: "Please enter a valid uploader profile / web link URL.",
      };
    }
  }

  try {
    // Find staff profile for uploader defaults
    let uploaderName = data.customUploaderName?.trim() || currentUser.email.split("@")[0];
    let uploaderRole = data.customUploaderRole?.trim() || (currentUser.role === "SUPER_ADMIN" ? "Lead Career Master" : "Career Staff Officer");
    let uploaderAvatar = data.customUploaderAvatar?.trim() || null;
    let uploaderBio = data.customUploaderBio?.trim() || null;
    let uploaderLinkedIn = candidateLinkedIn || null;

    if (currentUser.role === "STAFF") {
      const [staff] = await db
        .select()
        .from(staffProfiles)
        .where(eq(staffProfiles.userId, currentUser.id))
        .limit(1);

      if (staff) {
        uploaderName = staff.fullName;
        uploaderRole = staff.designation || "Career Staff Officer";
        uploaderAvatar = staff.avatarUrl || uploaderAvatar;
        uploaderBio = staff.bio || uploaderBio;
        uploaderLinkedIn = staff.linkedInUrl || uploaderLinkedIn;
      }
    }

    const [created] = await db
      .insert(employabilityResources)
      .values({
        title: data.title.trim(),
        category: data.category?.trim() || "Technical Skills",
        resourceType: data.resourceType?.trim() || "DOCUMENT",
        resourceAddress: data.resourceAddress.trim(),
        uploaderUserId: currentUser.id,
        uploaderName,
        uploaderRole,
        uploaderAvatarUrl: uploaderAvatar,
        uploaderBio,
        uploaderLinkedIn,
        whyShared: data.whyShared.trim(),
        howToUse: data.howToUse.trim(),
        targetAudience: data.targetAudience?.trim() || "All Students",
        isPublished: data.isPublished ?? true,
        viewCount: 0,
      })
      .returning();

    await recordAuditLog({
      actorId: currentUser.id,
      action: "EMPLOYABILITY_RESOURCE_CREATED",
      entityType: "employability_resources",
      entityId: created.id,
      details: { title: created.title, category: created.category },
    });

    revalidatePath("/admin");
    revalidatePath("/training");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/modules");

    return { success: true, resourceId: created.id };
  } catch (err: unknown) {
    console.error("[createEmployabilityResourceAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to create resource." };
  }
}

/**
 * Super Admin & Staff: Update existing educational resource
 */
export async function updateEmployabilityResourceAction(
  resourceId: string,
  data: {
    title: string;
    category: string;
    resourceType?: string;
    resourceAddress: string;
    whyShared: string;
    howToUse: string;
    targetAudience?: string;
    isPublished?: boolean;
    uploaderName?: string;
    uploaderRole?: string;
    uploaderAvatarUrl?: string;
    uploaderBio?: string;
    uploaderLinkedIn?: string;
  },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    return { success: false, error: "Unauthorized access." };
  }

  if (!data.title?.trim()) {
    return { success: false, error: "Resource title is required." };
  }
  if (!data.resourceAddress?.trim()) {
    return { success: false, error: "Valid resource address is required." };
  }
  if (data.uploaderLinkedIn?.trim()) {
    try {
      const parsed = new URL(data.uploaderLinkedIn.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return {
          success: false,
          error: "Uploader profile / web link must start with http:// or https://",
        };
      }
    } catch {
      return {
        success: false,
        error: "Please enter a valid uploader profile / web link URL.",
      };
    }
  }

  try {
    const [updated] = await db
      .update(employabilityResources)
      .set({
        title: data.title.trim(),
        category: data.category?.trim() || "Technical Skills",
        resourceType: data.resourceType?.trim() || "DOCUMENT",
        resourceAddress: data.resourceAddress.trim(),
        uploaderName: data.uploaderName?.trim() || "Career Officer",
        uploaderRole: data.uploaderRole?.trim() || "Career Staff Officer",
        uploaderAvatarUrl: data.uploaderAvatarUrl?.trim() || null,
        uploaderBio: data.uploaderBio?.trim() || null,
        uploaderLinkedIn: data.uploaderLinkedIn?.trim() || null,
        whyShared: data.whyShared.trim(),
        howToUse: data.howToUse.trim(),
        targetAudience: data.targetAudience?.trim() || "All Students",
        isPublished: data.isPublished ?? true,
        updatedAt: new Date(),
      })
      .where(eq(employabilityResources.id, resourceId))
      .returning();

    if (!updated) {
      return { success: false, error: "Resource not found." };
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "EMPLOYABILITY_RESOURCE_UPDATED",
      entityType: "employability_resources",
      entityId: resourceId,
      details: { title: updated.title },
    });

    revalidatePath("/admin");
    revalidatePath("/training");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("[updateEmployabilityResourceAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to update resource." };
  }
}

/**
 * Super Admin & Staff: Delete educational resource
 */
export async function deleteEmployabilityResourceAction(resourceId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const [deleted] = await db
      .delete(employabilityResources)
      .where(eq(employabilityResources.id, resourceId))
      .returning();

    if (!deleted) {
      return { success: false, error: "Resource not found." };
    }

    await recordAuditLog({
      actorId: currentUser.id,
      action: "EMPLOYABILITY_RESOURCE_DELETED",
      entityType: "employability_resources",
      entityId: resourceId,
      details: { title: deleted.title },
    });

    revalidatePath("/admin");
    revalidatePath("/training");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("[deleteEmployabilityResourceAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to delete resource." };
  }
}

/**
 * Increment view count when a student views/downloads resource
 */
export async function incrementResourceViewAction(resourceId: string) {
  try {
    await db
      .update(employabilityResources)
      .set({
        viewCount: sql`${employabilityResources.viewCount} + 1`,
      })
      .where(eq(employabilityResources.id, resourceId));
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Super Admin & Staff: Seed standard high-impact educational resources
 */
export async function seedStandardEmployabilityResourcesAction() {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")) {
    return { success: false, error: "Unauthorized." };
  }

  const standards = [
    {
      title: "KSITM Official ATS-Optimized Technical CV Template (2026 Edition)",
      category: "Resume & ATS",
      resourceType: "DOCUMENT",
      resourceAddress: "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing",
      uploaderName: "Engr. Mallam Kabir Sani",
      uploaderRole: "Director of Career Advisory & Tech Mentorship",
      uploaderAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
      uploaderBio: "15+ years in technical recruitment and polytechnic career steering. Certified NACE Career Strategist.",
      uploaderLinkedIn: "https://www.linkedin.com/in/kabir-sani-ksitm",
      whyShared: "Over 68% of fresh polytechnic graduates get filtered by automated Applicant Tracking Systems because of tables, multi-column layouts, and unparsable headings. This template is tested against top enterprise ATS parsers with a 98% pass rate.",
      howToUse: "Make a copy in Google Docs or download as DOCX. Fill in your National Diploma projects in the STAR format. Export strictly as PDF before submitting to job boards.",
      targetAudience: "All Students (ND I, ND II, HND)",
    },
    {
      title: "STAR Behavioral & Competency-Based Interview Playbook",
      category: "Interview Mastery",
      resourceType: "EXTERNAL_GUIDE",
      resourceAddress: "https://www.thebalancecareers.com/what-is-the-star-interview-response-technique-2061629",
      uploaderName: "Dr. Aisha Bello Mohammed",
      uploaderRole: "Lead Career Master & Industrial Liaison Officer",
      uploaderAvatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250",
      uploaderBio: "Senior Lecturer in Management Information Systems & Chairperson of KSITM Employability Taskforce.",
      uploaderLinkedIn: "https://www.linkedin.com/in/dr-aisha-bello",
      whyShared: "Hiring managers at multinational engineering firms in Kano and Abuja consistently report that while KSITM graduates have strong technical foundations, they struggle to articulate real project challenges during behavioral panel interviews.",
      howToUse: "Study the 4-stage framework: Situation (15%), Task (15%), Action (50%), Result (20%). Prepare 5 prepared STAR stories from your lab projects and student industrial work experience scheme (SIWES).",
      targetAudience: "Final Year ND II & HND Students",
    },
    {
      title: "Full-Stack Software Engineering Roadmap & GitHub Portfolio Blueprint",
      category: "Technical Skills",
      resourceType: "REPOSITORY",
      resourceAddress: "https://github.com/kamranahmedse/developer-roadmap",
      uploaderName: "Ibrahim Dahiru Usman",
      uploaderRole: "Senior Career Fellow & Software Systems Coach",
      uploaderAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
      uploaderBio: "Lead Software Architect & Advisor to National Centre for Artificial Intelligence and Robotics.",
      uploaderLinkedIn: "https://www.linkedin.com/in/ibrahim-dahiru-ksitm",
      whyShared: "Employers look for demonstrable proof of competence over grades alone. Having a clean GitHub repository with deployed live demos immediately sets a KSITM student apart from thousands of nationwide applicants.",
      howToUse: "Follow the milestone tracks: Git fundamentals -> RESTful APIs -> Cloud hosting -> Clean architecture. Commit daily and pin your 3 most complex assignments on your public profile.",
      targetAudience: "Computer Science & Telecom Tech Cohorts",
    },
    {
      title: "Workplace Ethics, Corporate Etiquette & Email Protocol Guide",
      category: "Workplace Ethics",
      resourceType: "SLIDES",
      resourceAddress: "https://drive.google.com/file/d/1WorkplaceEthicsKSITM2026/view",
      uploaderName: "Fatima Zahra Garba",
      uploaderRole: "Student Advisory Counselor & HR Consultant",
      uploaderAvatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250",
      uploaderBio: "Human Capital Consultant with expertise in workplace diversity, emotional intelligence, and industrial conflict resolution.",
      uploaderLinkedIn: "https://www.linkedin.com/in/fatima-zahra-garba",
      whyShared: "Navigating corporate communication, managing deadlines, handling conflict, and drafting executive emails are vital soft skills that protect career progression during the initial 90 days of employment.",
      howToUse: "Review slides 12 through 28 on formal correspondence and conflict management. Apply the provided email templates when reaching out to prospective internship supervisors.",
      targetAudience: "All Students",
    },
  ];

  try {
    for (const item of standards) {
      const [existing] = await db
        .select({ id: employabilityResources.id })
        .from(employabilityResources)
        .where(eq(employabilityResources.title, item.title))
        .limit(1);

      if (!existing) {
        await db.insert(employabilityResources).values({
          ...item,
          uploaderUserId: currentUser.id,
          isPublished: true,
          viewCount: 12,
        });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/training");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    console.error("[seedStandardEmployabilityResourcesAction] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to seed resources." };
  }
}
