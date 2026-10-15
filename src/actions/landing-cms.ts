"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  heroSlides,
  careerServices,
  testimonials,
  galleryItems,
  leadershipProfiles,
  announcements,
  footerLinks,
  siteContactInfo,
  socialLinks,
  type HeroSlideRecord,
  type CareerServiceRecord,
  type TestimonialRecord,
  type FooterLinkRecord,
  type SiteContactInfoRecord,
  type SocialLinkRecord,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";

async function requireAdminOrStaff() {
  const currentUser = await getCurrentUser();
  if (
    !currentUser ||
    (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "STAFF")
  ) {
    throw new Error("Unauthorized to manage Landing Page CMS content.");
  }
  return currentUser;
}

// =================================================================
// 1. HERO SLIDESHOW CRUD
// =================================================================

export async function listHeroSlidesAction(): Promise<HeroSlideRecord[]> {
  try {
    return await db
      .select()
      .from(heroSlides)
      .orderBy(asc(heroSlides.displayOrder), desc(heroSlides.createdAt));
  } catch (err) {
    console.error("[listHeroSlidesAction] Error:", err);
    return [];
  }
}

export type CreateHeroSlideInput = {
  title?: string;
  subtitle?: string;
  imageUrl: string;
  imageAlt?: string;
  ctaText?: string;
  ctaLink?: string;
  displayOrder?: number;
  isActive?: boolean;
};

export async function createHeroSlideAction(
  input: CreateHeroSlideInput,
): Promise<{ success: boolean; slideId?: string; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();
    if (!input.imageUrl?.trim()) {
      return { success: false, error: "Image URL is required for hero slide." };
    }

    const [inserted] = await db
      .insert(heroSlides)
      .values({
        title: input.title?.trim() || null,
        subtitle: input.subtitle?.trim() || null,
        imageUrl: input.imageUrl.trim(),
        imageAlt: input.imageAlt?.trim() || "KSITM Digital Campus Slide",
        ctaText: input.ctaText?.trim() || "Get Started / Enrol Now",
        ctaLink: input.ctaLink?.trim() || "/register",
        displayOrder: input.displayOrder ?? 0,
        isActive: input.isActive ?? true,
      })
      .returning();

    await recordAuditLog({
      actorId: actor.id,
      action: "HERO_SLIDE_CREATED",
      entityType: "hero_slides",
      entityId: inserted.id,
      details: { title: input.title },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, slideId: inserted.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create hero slide.",
    };
  }
}

export async function updateHeroSlideAction(
  id: string,
  input: Partial<CreateHeroSlideInput>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();

    await db
      .update(heroSlides)
      .set({
        ...(input.title !== undefined && { title: input.title.trim() || null }),
        ...(input.subtitle !== undefined && { subtitle: input.subtitle.trim() || null }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl.trim() }),
        ...(input.imageAlt !== undefined && { imageAlt: input.imageAlt.trim() }),
        ...(input.ctaText !== undefined && { ctaText: input.ctaText.trim() }),
        ...(input.ctaLink !== undefined && { ctaLink: input.ctaLink.trim() }),
        ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(heroSlides.id, id));

    await recordAuditLog({
      actorId: actor.id,
      action: "HERO_SLIDE_UPDATED",
      entityType: "hero_slides",
      entityId: id,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update hero slide.",
    };
  }
}

export async function deleteHeroSlideAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();
    await db.delete(heroSlides).where(eq(heroSlides.id, id));

    await recordAuditLog({
      actorId: actor.id,
      action: "HERO_SLIDE_DELETED",
      entityType: "hero_slides",
      entityId: id,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete hero slide.",
    };
  }
}

// =================================================================
// 2. CAREER SERVICES CRUD (CMS)
// =================================================================

export async function listCareerServicesCmsAction(): Promise<CareerServiceRecord[]> {
  try {
    return await db
      .select()
      .from(careerServices)
      .orderBy(asc(careerServices.displayOrder), asc(careerServices.title));
  } catch (err) {
    console.error("[listCareerServicesCmsAction] Error:", err);
    return [];
  }
}

export type CreateCareerServiceInput = {
  slug: string;
  title: string;
  summary: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: boolean;
};

export async function createCareerServiceAction(
  input: CreateCareerServiceInput,
): Promise<{ success: boolean; serviceId?: string; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();
    const cleanSlug = input.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!cleanSlug || !input.title?.trim() || !input.summary?.trim()) {
      return { success: false, error: "Title, slug, and summary are required." };
    }

    const [inserted] = await db
      .insert(careerServices)
      .values({
        slug: cleanSlug,
        title: input.title.trim(),
        summary: input.summary.trim(),
        description: input.description?.trim() || input.summary.trim(),
        icon: input.icon?.trim() || "fa-briefcase",
        displayOrder: input.displayOrder ?? 0,
        isActive: input.isActive ?? true,
      })
      .returning();

    await recordAuditLog({
      actorId: actor.id,
      action: "SERVICE_CREATED",
      entityType: "career_services",
      entityId: cleanSlug,
      details: { title: input.title },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true, serviceId: inserted.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create career service.",
    };
  }
}

export async function updateCareerServiceAction(
  id: string,
  input: Partial<CreateCareerServiceInput>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();

    const patch: Partial<typeof careerServices.$inferInsert> = {};
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.summary !== undefined) patch.summary = input.summary.trim();
    if (input.description !== undefined) patch.description = input.description.trim();
    if (input.icon !== undefined) patch.icon = input.icon.trim();
    if (input.displayOrder !== undefined) patch.displayOrder = input.displayOrder;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    if (input.slug !== undefined) {
      patch.slug = input.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    await db.update(careerServices).set(patch).where(eq(careerServices.id, id));

    await recordAuditLog({
      actorId: actor.id,
      action: "SERVICE_UPDATED",
      entityType: "career_services",
      entityId: id,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update career service.",
    };
  }
}

export async function deleteCareerServiceAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();
    await db.delete(careerServices).where(eq(careerServices.id, id));

    await recordAuditLog({
      actorId: actor.id,
      action: "SERVICE_DELETED",
      entityType: "career_services",
      entityId: id,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete career service.",
    };
  }
}

// =================================================================
// 3. WHAT STUDENTS SAY (TESTIMONIALS) CRUD
// =================================================================

export async function listTestimonialsCmsAction(): Promise<TestimonialRecord[]> {
  try {
    return await db
      .select()
      .from(testimonials)
      .orderBy(asc(testimonials.displayOrder), desc(testimonials.createdAt));
  } catch (err) {
    console.error("[listTestimonialsCmsAction] Error:", err);
    return [];
  }
}

export type CreateTestimonialInput = {
  name: string;
  role: string;
  quote: string;
  rating?: number;
  avatarInitials?: string;
  isPublished?: boolean;
  displayOrder?: number;
};

export async function createTestimonialAction(
  input: CreateTestimonialInput,
): Promise<{ success: boolean; testimonialId?: string; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();
    if (!input.name?.trim() || !input.quote?.trim() || !input.role?.trim()) {
      return { success: false, error: "Name, role, and quote are required." };
    }

    const initials =
      input.avatarInitials?.trim() ||
      input.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const [inserted] = await db
      .insert(testimonials)
      .values({
        name: input.name.trim(),
        role: input.role.trim(),
        quote: input.quote.trim(),
        rating: Math.min(5, Math.max(1, input.rating ?? 5)),
        avatarInitials: initials,
        isPublished: input.isPublished ?? true,
        displayOrder: input.displayOrder ?? 0,
      })
      .returning();

    await recordAuditLog({
      actorId: actor.id,
      action: "TESTIMONIAL_CREATED",
      entityType: "testimonials",
      entityId: inserted.id,
      details: { name: input.name },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, testimonialId: inserted.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create testimonial.",
    };
  }
}

export async function updateTestimonialAction(
  id: string,
  input: Partial<CreateTestimonialInput>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();

    const patch: Partial<typeof testimonials.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.role !== undefined) patch.role = input.role.trim();
    if (input.quote !== undefined) patch.quote = input.quote.trim();
    if (input.rating !== undefined) patch.rating = Math.min(5, Math.max(1, input.rating));
    if (input.avatarInitials !== undefined) patch.avatarInitials = input.avatarInitials.trim();
    if (input.isPublished !== undefined) patch.isPublished = input.isPublished;
    if (input.displayOrder !== undefined) patch.displayOrder = input.displayOrder;

    await db.update(testimonials).set(patch).where(eq(testimonials.id, id));

    await recordAuditLog({
      actorId: actor.id,
      action: "TESTIMONIAL_UPDATED",
      entityType: "testimonials",
      entityId: id,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update testimonial.",
    };
  }
}

export async function deleteTestimonialAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();
    await db.delete(testimonials).where(eq(testimonials.id, id));

    await recordAuditLog({
      actorId: actor.id,
      action: "TESTIMONIAL_DELETED",
      entityType: "testimonials",
      entityId: id,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete testimonial.",
    };
  }
}

// =================================================================
// 4. FOOTER & CONTACTS CRUD
// =================================================================

export type FooterCmsData = {
  serviceLinks: FooterLinkRecord[];
  resourceLinks: FooterLinkRecord[];
  contactInfo: SiteContactInfoRecord | null;
  socialLinks: SocialLinkRecord[];
};

export async function getFooterCmsDataAction(): Promise<FooterCmsData> {
  try {
    const [links, contacts, socials] = await Promise.all([
      db.select().from(footerLinks).orderBy(asc(footerLinks.displayOrder), asc(footerLinks.label)),
      db.select().from(siteContactInfo).limit(1),
      db.select().from(socialLinks).orderBy(asc(socialLinks.displayOrder), asc(socialLinks.platform)),
    ]);

    return {
      serviceLinks: links.filter((l) => l.category === "SERVICES"),
      resourceLinks: links.filter((l) => l.category === "RESOURCES"),
      contactInfo: contacts[0] || null,
      socialLinks: socials,
    };
  } catch (err) {
    console.error("[getFooterCmsDataAction] Error:", err);
    return {
      serviceLinks: [],
      resourceLinks: [],
      contactInfo: null,
      socialLinks: [],
    };
  }
}

export type CreateFooterLinkInput = {
  category: "SERVICES" | "RESOURCES";
  label: string;
  url: string;
  isExternal?: boolean;
  displayOrder?: number;
  isActive?: boolean;
};

export async function createFooterLinkAction(
  input: CreateFooterLinkInput,
): Promise<{ success: boolean; linkId?: string; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();
    if (!input.label?.trim() || !input.url?.trim()) {
      return { success: false, error: "Link label and destination URL are required." };
    }

    const [inserted] = await db
      .insert(footerLinks)
      .values({
        category: input.category,
        label: input.label.trim(),
        url: input.url.trim(),
        isExternal: input.isExternal ?? false,
        displayOrder: input.displayOrder ?? 0,
        isActive: input.isActive ?? true,
      })
      .returning();

    await recordAuditLog({
      actorId: actor.id,
      action: "FOOTER_LINK_CREATED",
      entityType: "footer_links",
      entityId: inserted.id,
      details: { label: input.label, category: input.category },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, linkId: inserted.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create footer link.",
    };
  }
}

export async function updateFooterLinkAction(
  id: string,
  input: Partial<CreateFooterLinkInput>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();

    const patch: Partial<typeof footerLinks.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.category !== undefined) patch.category = input.category;
    if (input.label !== undefined) patch.label = input.label.trim();
    if (input.url !== undefined) patch.url = input.url.trim();
    if (input.isExternal !== undefined) patch.isExternal = input.isExternal;
    if (input.displayOrder !== undefined) patch.displayOrder = input.displayOrder;
    if (input.isActive !== undefined) patch.isActive = input.isActive;

    await db.update(footerLinks).set(patch).where(eq(footerLinks.id, id));

    await recordAuditLog({
      actorId: actor.id,
      action: "FOOTER_LINK_UPDATED",
      entityType: "footer_links",
      entityId: id,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update footer link.",
    };
  }
}

export async function deleteFooterLinkAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();
    await db.delete(footerLinks).where(eq(footerLinks.id, id));

    await recordAuditLog({
      actorId: actor.id,
      action: "FOOTER_LINK_DELETED",
      entityType: "footer_links",
      entityId: id,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete footer link.",
    };
  }
}

export type UpdateSiteContactInput = {
  institutionName?: string;
  centreName?: string;
  address?: string;
  email?: string;
  phone?: string;
  phoneContact?: string;
  websiteUrl?: string;
  copyrightText?: string;
};

export async function updateSiteContactInfoAction(
  input: UpdateSiteContactInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();

    const [existing] = await db.select().from(siteContactInfo).limit(1);

    if (existing) {
      await db
        .update(siteContactInfo)
        .set({
          ...(input.institutionName !== undefined && { institutionName: input.institutionName.trim() }),
          ...(input.centreName !== undefined && { centreName: input.centreName.trim() }),
          ...(input.address !== undefined && { address: input.address.trim() }),
          ...(input.email !== undefined && { email: input.email.trim() }),
          ...(input.phone !== undefined && { phone: input.phone.trim() }),
          ...(input.phoneContact !== undefined && { phoneContact: input.phoneContact.trim() }),
          ...(input.websiteUrl !== undefined && { websiteUrl: input.websiteUrl.trim() }),
          ...(input.copyrightText !== undefined && { copyrightText: input.copyrightText.trim() }),
          updatedAt: new Date(),
        })
        .where(eq(siteContactInfo.id, existing.id));
    } else {
      await db.insert(siteContactInfo).values({
        institutionName: input.institutionName?.trim() || "Katsina State Institute of Technology and Management",
        centreName: input.centreName?.trim() || "Directorate of Career Services & Linkages",
        address: input.address?.trim() || "KSITM Campus, Katsina State, Nigeria",
        email: input.email?.trim() || "contact@ksitmcareers.edu.ng",
        phone: input.phone?.trim() || "09062125845",
        phoneContact: input.phoneContact?.trim() || "Nura Sadiq",
        websiteUrl: input.websiteUrl?.trim() || "https://www.ksitmcareers.edu.ng",
        copyrightText: input.copyrightText?.trim() || "© 2026 KSITM Careers. All rights reserved.",
      });
    }

    await recordAuditLog({
      actorId: actor.id,
      action: "SITE_CONTACT_UPDATED",
      entityType: "site_contact_info",
      entityId: "primary",
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update contact info.",
    };
  }
}

export type SaveSocialLinkInput = {
  id?: string;
  platform: string;
  url: string;
  isActive?: boolean;
  displayOrder?: number;
};

export async function saveSocialLinkAction(
  input: SaveSocialLinkInput,
): Promise<{ success: boolean; linkId?: string; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();
    if (!input.platform?.trim() || !input.url?.trim()) {
      return { success: false, error: "Platform and URL are required." };
    }

    if (input.id) {
      await db
        .update(socialLinks)
        .set({
          platform: input.platform.trim().toUpperCase(),
          url: input.url.trim(),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
          ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
        })
        .where(eq(socialLinks.id, input.id));

      await recordAuditLog({
        actorId: actor.id,
        action: "SOCIAL_LINK_UPDATED",
        entityType: "social_links",
        entityId: input.id,
      });

      revalidatePath("/");
      revalidatePath("/admin");
      return { success: true, linkId: input.id };
    } else {
      const [inserted] = await db
        .insert(socialLinks)
        .values({
          platform: input.platform.trim().toUpperCase(),
          url: input.url.trim(),
          isActive: input.isActive ?? true,
          displayOrder: input.displayOrder ?? 0,
        })
        .returning();

      await recordAuditLog({
        actorId: actor.id,
        action: "SOCIAL_LINK_CREATED",
        entityType: "social_links",
        entityId: inserted.id,
      });

      revalidatePath("/");
      revalidatePath("/admin");
      return { success: true, linkId: inserted.id };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save social link.",
    };
  }
}

export async function deleteSocialLinkAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actor = await requireAdminOrStaff();
    await db.delete(socialLinks).where(eq(socialLinks.id, id));

    await recordAuditLog({
      actorId: actor.id,
      action: "SOCIAL_LINK_DELETED",
      entityType: "social_links",
      entityId: id,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete social link.",
    };
  }
}
