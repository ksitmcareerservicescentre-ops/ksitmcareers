import { Hero } from "@/components/public/hero";
import { Services } from "@/components/public/services";
import { Gallery } from "@/components/public/gallery";
import { Leadership } from "@/components/public/leadership";
import { Updates } from "@/components/public/updates";
import { Training } from "@/components/public/training";
import { Testimonials } from "@/components/public/testimonials";
import { LaunchEventVideos } from "@/components/public/launch-event-videos";
import { db } from "@/db";
import {
  announcements,
  careerServices,
  galleryItems,
  leadershipProfiles,
  launchEventVideos,
  testimonials,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [gallery, leadership, updates, servicesList, eventVideos, testimonialsList] =
    process.env.DATABASE_URL
      ? await Promise.all([
          db
            .select()
            .from(galleryItems)
            .where(eq(galleryItems.isPublished, true))
            .orderBy(asc(galleryItems.displayOrder)),
          db
            .select()
            .from(leadershipProfiles)
            .where(eq(leadershipProfiles.isPublished, true))
            .orderBy(asc(leadershipProfiles.displayOrder)),
          db
            .select()
            .from(announcements)
            .where(eq(announcements.isPublished, true))
            .orderBy(asc(announcements.createdAt)),
          db
            .select()
            .from(careerServices)
            .where(eq(careerServices.isActive, true))
            .orderBy(asc(careerServices.displayOrder)),
          db
            .select()
            .from(launchEventVideos)
            .where(eq(launchEventVideos.isPublished, true))
            .orderBy(asc(launchEventVideos.displayOrder)),
          db
            .select()
            .from(testimonials)
            .where(eq(testimonials.isPublished, true))
            .orderBy(asc(testimonials.displayOrder)),
        ])
      : [[], [], [], [], [], []];

  return (
    <>
      <Hero />
      <Services services={servicesList} />
      <Gallery items={gallery} />
      <Leadership profiles={leadership} />
      <Updates announcements={updates} />
      <Training />
      <LaunchEventVideos videos={eventVideos} />
      <Testimonials testimonials={testimonialsList} />
    </>
  );
}
