import { Hero } from "@/components/public/hero";
import { Services } from "@/components/public/services";
import { Gallery } from "@/components/public/gallery";
import { Leadership } from "@/components/public/leadership";
import { Updates } from "@/components/public/updates";
import { Training } from "@/components/public/training";
import { Testimonials } from "@/components/public/testimonials";
import { db } from "@/db";
import { announcements, galleryItems, leadershipProfiles } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export default async function Home() {
  const [gallery, leadership, updates] = await Promise.all([
    db.select().from(galleryItems).where(eq(galleryItems.isPublished, true)).orderBy(asc(galleryItems.displayOrder)),
    db.select().from(leadershipProfiles).where(eq(leadershipProfiles.isPublished, true)).orderBy(asc(leadershipProfiles.displayOrder)),
    db.select().from(announcements).where(eq(announcements.isPublished, true)).orderBy(asc(announcements.createdAt)),
  ]);
  return (
    <>
      <Hero />
      <Services />
      <Gallery items={gallery} />
      <Leadership profiles={leadership} />
      <Updates announcements={updates} />
      <Training />
      <Testimonials />
    </>
  );
}
