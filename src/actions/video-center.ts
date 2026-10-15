"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { trainingVideos, trainingCategories } from "@/db/schema";
import { parseTrainingMedia } from "@/lib/training-media";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

async function requireAdminOrStaff() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "STAFF")) {
    throw new Error("Unauthorized to manage Video Center curriculum.");
  }
  return user;
}

export interface VideoCenterRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  slug: string;
  description: string;
  videoProvider: string;
  videoUrl: string;
  videoId: string;
  thumbnailUrl: string | null;
  instructor: string | null;
  durationMinutes: number | null;
  displayOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVideoInput {
  title: string;
  categoryName: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  instructor?: string;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface UpdateVideoInput {
  id: string;
  title: string;
  categoryName: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  instructor?: string;
  displayOrder?: number;
  isPublished?: boolean;
}

export async function listVideoCenterVideosAction(): Promise<VideoCenterRecord[]> {
  const rows = await db
    .select({
      id: trainingVideos.id,
      categoryId: trainingVideos.categoryId,
      categoryName: trainingCategories.name,
      title: trainingVideos.title,
      slug: trainingVideos.slug,
      description: trainingVideos.description,
      videoProvider: trainingVideos.videoProvider,
      videoUrl: trainingVideos.videoUrl,
      videoId: trainingVideos.videoId,
      thumbnailUrl: trainingVideos.thumbnailUrl,
      instructor: trainingVideos.instructor,
      durationMinutes: trainingVideos.durationMinutes,
      displayOrder: trainingVideos.displayOrder,
      isPublished: trainingVideos.isPublished,
      createdAt: trainingVideos.createdAt,
      updatedAt: trainingVideos.updatedAt,
    })
    .from(trainingVideos)
    .innerJoin(
      trainingCategories,
      eq(trainingVideos.categoryId, trainingCategories.id),
    )
    .orderBy(asc(trainingVideos.displayOrder), desc(trainingVideos.createdAt));

  return rows;
}

export async function listVideoCenterCategoriesAction(): Promise<string[]> {
  const rows = await db
    .select({ name: trainingCategories.name })
    .from(trainingCategories)
    .orderBy(asc(trainingCategories.displayOrder), asc(trainingCategories.name));

  return rows.map((r) => r.name);
}

export async function createVideoCenterVideoAction(
  data: CreateVideoInput,
): Promise<{ success: boolean; item?: VideoCenterRecord; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();

    const title = data.title.trim();
    const description = data.description.trim();
    const videoUrl = data.videoUrl.trim();
    const categoryName = data.categoryName.trim() || "Employability Skills";

    if (!title) return { success: false, error: "Video title is required." };
    if (!description)
      return { success: false, error: "Description is required." };
    if (!videoUrl) return { success: false, error: "Video URL is required." };

    const media = parseTrainingMedia(videoUrl);
    if (!media) {
      return {
        success: false,
        error:
          "Please enter a valid HTTPS YouTube URL or direct video URL (MP4/WebM).",
      };
    }

    const categorySlug = categoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let [category] = await db
      .select({ id: trainingCategories.id, name: trainingCategories.name })
      .from(trainingCategories)
      .where(eq(trainingCategories.slug, categorySlug))
      .limit(1);

    if (!category) {
      const [newCat] = await db
        .insert(trainingCategories)
        .values({
          name: categoryName,
          slug: categorySlug,
          displayOrder: 0,
        })
        .returning({
          id: trainingCategories.id,
          name: trainingCategories.name,
        });
      category = newCat;
    }

    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const [created] = await db
      .insert(trainingVideos)
      .values({
        categoryId: category.id,
        title,
        slug,
        description,
        videoProvider: media.provider,
        videoUrl,
        videoId: media.id,
        thumbnailUrl: data.thumbnailUrl?.trim() || null,
        instructor: data.instructor?.trim() || null,
        displayOrder: data.displayOrder ?? 0,
        isPublished: data.isPublished ?? true,
      })
      .returning();

    await recordAuditLog({
      actorId: actor.id,
      action: "TRAINING_VIDEO_CREATED",
      entityType: "training_videos",
      entityId: created.id,
      details: { title, category: category.name },
    });

    revalidatePath("/admin");
    revalidatePath("/training");
    revalidatePath("/training/preview");
    revalidatePath("/dashboard");

    return {
      success: true,
      item: {
        ...created,
        categoryName: category.name,
      },
    };
  } catch (error) {
    console.error("[VideoCenter] create failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create video.",
    };
  }
}

export async function updateVideoCenterVideoAction(
  data: UpdateVideoInput,
): Promise<{ success: boolean; item?: VideoCenterRecord; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();

    const title = data.title.trim();
    const description = data.description.trim();
    const videoUrl = data.videoUrl.trim();
    const categoryName = data.categoryName.trim() || "Employability Skills";

    if (!data.id) return { success: false, error: "Video ID missing." };
    if (!title) return { success: false, error: "Video title is required." };
    if (!description)
      return { success: false, error: "Description is required." };
    if (!videoUrl) return { success: false, error: "Video URL is required." };

    const media = parseTrainingMedia(videoUrl);
    if (!media) {
      return {
        success: false,
        error:
          "Please enter a valid HTTPS YouTube URL or direct video URL (MP4/WebM).",
      };
    }

    const categorySlug = categoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let [category] = await db
      .select({ id: trainingCategories.id, name: trainingCategories.name })
      .from(trainingCategories)
      .where(eq(trainingCategories.slug, categorySlug))
      .limit(1);

    if (!category) {
      const [newCat] = await db
        .insert(trainingCategories)
        .values({
          name: categoryName,
          slug: categorySlug,
          displayOrder: 0,
        })
        .returning({
          id: trainingCategories.id,
          name: trainingCategories.name,
        });
      category = newCat;
    }

    const [updated] = await db
      .update(trainingVideos)
      .set({
        categoryId: category.id,
        title,
        description,
        videoProvider: media.provider,
        videoUrl,
        videoId: media.id,
        thumbnailUrl: data.thumbnailUrl?.trim() || null,
        instructor: data.instructor?.trim() || null,
        displayOrder: data.displayOrder ?? 0,
        isPublished: data.isPublished ?? true,
        updatedAt: new Date(),
      })
      .where(eq(trainingVideos.id, data.id))
      .returning();

    await recordAuditLog({
      actorId: actor.id,
      action: "TRAINING_VIDEO_UPDATED",
      entityType: "training_videos",
      entityId: updated.id,
      details: { title, category: category.name },
    });

    revalidatePath("/admin");
    revalidatePath("/training");
    revalidatePath("/training/preview");
    revalidatePath("/dashboard");

    return {
      success: true,
      item: {
        ...updated,
        categoryName: category.name,
      },
    };
  } catch (error) {
    console.error("[VideoCenter] update failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update video.",
    };
  }
}

export async function deleteVideoCenterVideoAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();

    await db.delete(trainingVideos).where(eq(trainingVideos.id, id));

    await recordAuditLog({
      actorId: actor.id,
      action: "TRAINING_VIDEO_DELETED",
      entityType: "training_videos",
      entityId: id,
    });

    revalidatePath("/admin");
    revalidatePath("/training");
    revalidatePath("/training/preview");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[VideoCenter] delete failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete video.",
    };
  }
}

export async function toggleVideoCenterPublishAction(
  id: string,
  isPublished: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();

    await db
      .update(trainingVideos)
      .set({ isPublished, updatedAt: new Date() })
      .where(eq(trainingVideos.id, id));

    await recordAuditLog({
      actorId: actor.id,
      action: isPublished
        ? "TRAINING_VIDEO_PUBLISHED"
        : "TRAINING_VIDEO_UNPUBLISHED",
      entityType: "training_videos",
      entityId: id,
    });

    revalidatePath("/admin");
    revalidatePath("/training");
    revalidatePath("/training/preview");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[VideoCenter] toggle publish failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to toggle status.",
    };
  }
}
