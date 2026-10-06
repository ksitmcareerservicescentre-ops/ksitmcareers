"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  staffProfiles,
  careerServices,
  galleryItems,
  leadershipProfiles,
  announcements,
  trainingCategories,
  trainingVideos,
  appointments,
  consultationRequests,
  studentServiceEntitlements,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { recordAuditLog } from "@/lib/audit";

export interface OfficerActionResult {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createCareerOfficerAction(
  _prevState: OfficerActionResult | null,
  formData: FormData,
): Promise<OfficerActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized. Super Admin permissions required." };
  }

  const fullName = formData.get("fullName")?.toString().trim() || "";
  const staffCode =
    formData.get("staffCode")?.toString().trim().toUpperCase() || "";
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const password = formData.get("password")?.toString().trim() || "";
  const designation =
    formData.get("designation")?.toString().trim() || "Career Officer";
  const canManageAppointments = formData.get("canManageAppointments") === "on";
  const canManageServices = formData.get("canManageServices") === "on";

  const fieldErrors: Record<string, string> = {};

  if (!fullName || fullName.length < 3) {
    fieldErrors.fullName = "Full name must be at least 3 characters long.";
  }
  if (!staffCode || staffCode.length < 3) {
    fieldErrors.staffCode =
      "A valid staff code is required (e.g. KSITM/STAFF/CO/003).";
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Please provide a valid institutional email address.";
  }
  if (!password || password.length < 6) {
    fieldErrors.password = "Password must be at least 6 characters long.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please correct the highlighted fields.", fieldErrors };
  }

  try {
    // Check if email already in use
    const [existingEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`)
      .limit(1);

    if (existingEmail) {
      return {
        error: "An account with this email address already exists.",
        fieldErrors: { email: "Email already registered." },
      };
    }

    // Check if staff code already in use
    const [existingCode] = await db
      .select({ id: staffProfiles.id })
      .from(staffProfiles)
      .where(sql`upper(${staffProfiles.staffCode}) = upper(${staffCode})`)
      .limit(1);

    if (existingCode) {
      return {
        error: "This staff code is already assigned to another staff member.",
        fieldErrors: { staffCode: "Staff code already exists." },
      };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: "STAFF",
        isActive: true,
      })
      .returning({ id: users.id });

    // Create staff profile
    await db.insert(staffProfiles).values({
      userId: newUser.id,
      fullName,
      staffCode,
      designation,
      canManageAppointments,
      canManageServices,
      canManageTraining: true,
      canManageMentorship: true,
    });

    // Record audit
    await recordAuditLog({
      actorId: currentUser.id,
      action: "STAFF_CREATED",
      entityType: "staff_profiles",
      entityId: newUser.id,
      details: { fullName, staffCode, email, designation },
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: `Career Officer ${fullName} (${email}) created successfully!`,
    };
  } catch (err) {
    console.error("[AdminAction] Error creating career officer:", err);
    return { error: "Failed to create career officer. Please try again." };
  }
}

export async function toggleStaffStatusAction(
  staffUserId: string,
  currentStatus: boolean,
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    return { success: false, error: "Unauthorized." };
  }

  try {
    await db
      .update(users)
      .set({ isActive: !currentStatus })
      .where(eq(users.id, staffUserId));

    await recordAuditLog({
      actorId: currentUser.id,
      action: currentStatus ? "STAFF_DEACTIVATED" : "STAFF_ACTIVATED",
      entityType: "users",
      entityId: staffUserId,
      details: { newStatus: !currentStatus },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("[AdminAction] Error toggling staff status:", err);
    return { success: false, error: "Database update failed." };
  }
}

async function requireSuperAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  return currentUser;
}

export async function createLandingContentAction(
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const actor = await requireSuperAdmin();
    const kind = String(formData.get("kind") || "");
    const text = (name: string) => String(formData.get(name) || "").trim();
    if (kind === "service") {
      const slug = text("slug").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
      if (!slug || !text("title") || !text("summary")) return { error: "Service title, slug and summary are required." };
      await db.insert(careerServices).values({ slug, title: text("title"), summary: text("summary"), description: text("description") || text("summary"), icon: text("icon") || "fa-briefcase", displayOrder: Number(formData.get("displayOrder") || 0) });
      await recordAuditLog({ actorId: actor.id, action: "SERVICE_CREATED", entityType: "career_services", entityId: slug, details: { title: text("title") } });
    } else if (kind === "gallery") {
      await db.insert(galleryItems).values({ title: text("title"), caption: text("caption"), imageUrl: text("imageUrl"), imageAlt: text("imageAlt") || text("title"), displayOrder: Number(formData.get("displayOrder") || 0), isPublished: formData.get("isPublished") === "on" });
    } else if (kind === "leadership") {
      await db.insert(leadershipProfiles).values({ name: text("name"), position: text("position"), imageUrl: text("imageUrl"), imageAlt: text("imageAlt") || text("name"), summary: text("summary"), biography: text("biography").split("\n").filter(Boolean), displayOrder: Number(formData.get("displayOrder") || 0), isPublished: formData.get("isPublished") === "on" });
    } else if (kind === "announcement") {
      await db.insert(announcements).values({ title: text("title"), summary: text("summary"), content: text("content"), imageUrl: text("imageUrl") || null, isPublished: formData.get("isPublished") === "on", publishedAt: formData.get("isPublished") === "on" ? new Date() : null });
    } else if (kind === "training") {
      const categoryName = text("category") || "Employability Skills";
      const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      let [category] = await db.select({ id: trainingCategories.id }).from(trainingCategories).where(eq(trainingCategories.slug, categorySlug)).limit(1);
      if (!category) [category] = await db.insert(trainingCategories).values({ name: categoryName, slug: categorySlug }).returning({ id: trainingCategories.id });
      const videoUrl = text("videoUrl");
      const match = videoUrl.match(/(?:youtu\.be\/|[?&]v=|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/);
      if (!match) return { error: "Enter a valid YouTube URL." };
      await db.insert(trainingVideos).values({ categoryId: category.id, title: text("title"), slug: text("title").toLowerCase().replace(/[^a-z0-9]+/g, "-"), description: text("description"), videoUrl, videoId: match[1], instructor: text("instructor") || null, isPublished: formData.get("isPublished") === "on" });
    } else return { error: "Unsupported content type." };
    revalidatePath("/"); revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[AdminAction] content create failed", error);
    return { error: "Unable to save content. Check required fields and uniqueness." };
  }
}

export async function bulkImportGalleryAction(
  _prevState: { success?: boolean; message?: string; error?: string } | null,
  formData: FormData,
): Promise<{ success?: boolean; message?: string; error?: string }> {
  try {
    const actor = await requireSuperAdmin();
    const payload = String(formData.get("payload") || "");
    const parsed = JSON.parse(payload);
    if (!Array.isArray(parsed) || parsed.length === 0) return { error: "Upload a non-empty Cloudinary asset JSON file." };
    const assets = parsed.filter((asset) => typeof asset?.url === "string" && /^https:\/\/res\.cloudinary\.com\//.test(asset.url)).slice(0, 500);
    if (!assets.length) return { error: "No valid Cloudinary image URLs were found." };
    const existing = await db.select({ imageUrl: galleryItems.imageUrl }).from(galleryItems);
    const existingUrls = new Set(existing.map((item) => item.imageUrl));
    const values = assets.filter((asset) => !existingUrls.has(asset.url)).map((asset, index) => ({
      title: "KSITM Career Services Centre",
      caption: "A moment from the KSITM Career Services Centre community.",
      imageUrl: asset.url,
      imageAlt: "KSITM Career Services Centre gallery image",
      displayOrder: index,
      isPublished: true,
    }));
    if (values.length) await db.insert(galleryItems).values(values);
    await recordAuditLog({ actorId: actor.id, action: "GALLERY_BULK_IMPORTED", entityType: "gallery_items", entityId: "bulk", details: { received: assets.length, inserted: values.length } });
    revalidatePath("/"); revalidatePath("/gallery"); revalidatePath("/admin");
    return { success: true, message: `Imported ${values.length} new gallery images. ${assets.length - values.length} duplicates were skipped.` };
  } catch (error) {
    console.error("[AdminAction] gallery bulk import failed", error);
    return { error: "Unable to import gallery assets. Ensure the uploaded file is valid JSON." };
  }
}

export async function markAppointmentAttendanceAction(appointmentId: string, attended: boolean) {
  try {
    const actor = await requireSuperAdmin();
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
    if (!appointment) return { error: "Appointment not found." };
    const status = attended ? "COMPLETED" : "NO_SHOW";
    await db.update(appointments).set({ status, updatedAt: new Date() }).where(eq(appointments.id, appointmentId));
    if (appointment.consultationRequestId) await db.update(consultationRequests).set({ status: attended ? "COMPLETED" : "NO_SHOW", reviewedByStaffId: null, updatedAt: new Date() }).where(eq(consultationRequests.id, appointment.consultationRequestId));
    if (attended) await db.update(studentServiceEntitlements).set({ status: "ACTIVE", activatedAt: new Date(), updatedAt: new Date(), recommendationNote: "Activated after approved Career Services consultation attendance." }).where(eq(studentServiceEntitlements.studentId, appointment.studentId));
    await recordAuditLog({ actorId: actor.id, action: attended ? "APPOINTMENT_ATTENDANCE_APPROVED" : "APPOINTMENT_MARKED_NO_SHOW", entityType: "appointments", entityId: appointmentId, details: { attended } });
    revalidatePath("/admin"); revalidatePath("/dashboard");
    return { success: true };
  } catch (error) { console.error("[AdminAction] attendance update failed", error); return { error: "Unable to update attendance." }; }
}

export async function updateLandingContentAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const actor = await requireSuperAdmin();
    const kind = String(formData.get("kind") || "");
    const id = String(formData.get("id") || "");
    const text = (name: string) => String(formData.get(name) || "").trim();
    if (!id) return { error: "Content record not found." };
    const published = formData.get("isPublished") === "on";
    if (kind === "gallery") {
      await db.update(galleryItems).set({ title: text("title"), caption: text("caption"), imageUrl: text("imageUrl"), imageAlt: text("imageAlt") || text("title"), isPublished: published }).where(eq(galleryItems.id, id));
    } else if (kind === "leadership") {
      await db.update(leadershipProfiles).set({ name: text("name"), position: text("position"), imageUrl: text("imageUrl"), imageAlt: text("imageAlt") || text("name"), summary: text("summary"), biography: text("biography").split("\n").filter(Boolean), isPublished: published, updatedAt: new Date() }).where(eq(leadershipProfiles.id, id));
    } else if (kind === "announcement") {
      await db.update(announcements).set({ title: text("title"), summary: text("summary"), content: text("content"), imageUrl: text("imageUrl") || null, isPublished: published, publishedAt: published ? new Date() : null }).where(eq(announcements.id, id));
    } else return { error: "Unsupported content type." };
    await recordAuditLog({ actorId: actor.id, action: "PUBLIC_CONTENT_UPDATED", entityType: kind, entityId: id, details: { title: text("title") } });
    revalidatePath("/"); revalidatePath("/admin");
    return { success: true };
  } catch (error) { console.error("[AdminAction] content update failed", error); return { error: "Unable to update this content." }; }
}

export async function deleteLandingContentAction(kind: string, id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const actor = await requireSuperAdmin();
    if (kind === "gallery") await db.delete(galleryItems).where(eq(galleryItems.id, id));
    else if (kind === "leadership") await db.delete(leadershipProfiles).where(eq(leadershipProfiles.id, id));
    else if (kind === "announcement") await db.delete(announcements).where(eq(announcements.id, id));
    else return { error: "Unsupported content type." };
    await recordAuditLog({ actorId: actor.id, action: "PUBLIC_CONTENT_DELETED", entityType: kind, entityId: id });
    revalidatePath("/"); revalidatePath("/admin");
    return { success: true };
  } catch (error) { console.error("[AdminAction] content delete failed", error); return { error: "Unable to delete this content." }; }
}
