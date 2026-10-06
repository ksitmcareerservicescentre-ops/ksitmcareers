import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { Gallery } from "@/components/public/gallery";
import { db } from "@/db";
import { galleryItems } from "@/db/schema";

export const metadata: Metadata = { title: "Gallery — KSITM Careers", description: "Explore KSITM Career Services Centre moments and events." };
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const items = process.env.DATABASE_URL ? await db.select().from(galleryItems).where(eq(galleryItems.isPublished, true)).orderBy(asc(galleryItems.displayOrder)) : [];
  return <main className="min-h-screen bg-[#0A0A1A] pt-20"><Gallery items={items} fullPage /></main>;
}
