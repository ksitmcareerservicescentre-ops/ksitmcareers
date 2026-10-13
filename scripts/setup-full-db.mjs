import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function retry(fn, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed: ${err.message}. Retrying in ${delay}ms...`);
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

async function main() {
  console.log("=== 1. Creating Database Tables for Testimonials & Launch Event Videos ===");

  await retry(() => sql`
    CREATE TABLE IF NOT EXISTS testimonials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      quote TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      avatar_initials TEXT NOT NULL,
      is_published BOOLEAN NOT NULL DEFAULT true,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `);
  console.log("Created table testimonials (if not exists)");

  await retry(() => sql`
    CREATE TABLE IF NOT EXISTS launch_event_videos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      video_url TEXT NOT NULL,
      description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_published BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `);
  console.log("Created table launch_event_videos (if not exists)");

  console.log("\n=== 2. Creating Database Views for Singular / Alias Table Names ===");
  await retry(() => sql`CREATE OR REPLACE VIEW gallery_item AS SELECT * FROM gallery_items;`);
  await retry(() => sql`CREATE OR REPLACE VIEW employer AS SELECT * FROM partner_employers;`);
  await retry(() => sql`CREATE OR REPLACE VIEW job AS SELECT * FROM job_postings;`);
  await retry(() => sql`CREATE OR REPLACE VIEW internship AS SELECT * FROM virtual_internships;`);
  await retry(() => sql`CREATE OR REPLACE VIEW service AS SELECT * FROM career_services;`);
  await retry(() => sql`CREATE OR REPLACE VIEW testimonial AS SELECT * FROM testimonials;`);
  await retry(() => sql`CREATE OR REPLACE VIEW event_video AS SELECT * FROM launch_event_videos;`);
  console.log("Created views: gallery_item, employer, job, internship, service, testimonial, event_video");

  console.log("\n=== 3. Seeding Testimonials into Database ===");
  const existingTestimonials = await retry(() => sql`SELECT count(*)::int as count FROM testimonials;`);
  if (existingTestimonials[0].count === 0) {
    await retry(() => sql`
      INSERT INTO testimonials (name, role, quote, rating, avatar_initials, display_order, is_published)
      VALUES
        ('Amina Yusuf', 'Computer Software Engineering, ND II', 'The AI assistant helped me refine my resume and I landed a software internship within weeks. An incredible platform for KSITM students!', 5, 'AY', 1, true),
        ('Ibrahim Musa', 'Banking Operations & Finance, ND II', 'The virtual internship simulation program gave me real-world corporate experience with financial systems. I feel fully confident entering the labour market.', 5, 'IM', 2, true),
        ('Fatima Bello', 'Networking & Cloud Systems, ND II', 'One-on-one sessions with career officers helped me clarify my career path in cybersecurity. The institutional trust badges and verified guidance made all the difference.', 5, 'FB', 3, true);
    `);
    console.log("Seeded 3 student testimonials into database");
  } else {
    console.log("Testimonials already exist, count:", existingTestimonials[0].count);
  }

  console.log("\n=== 4. Seeding Launch Event Videos into Database ===");
  const existingVideos = await retry(() => sql`SELECT count(*)::int as count FROM launch_event_videos;`);
  if (existingVideos[0].count === 0) {
    await retry(() => sql`
      INSERT INTO launch_event_videos (title, video_url, description, display_order, is_published)
      VALUES
        ('Career Services Centre Launch', 'https://res.cloudinary.com/njlhwruu/video/upload/v1791260400/WhatsApp_Video_2026-09-29_at_6.53.04_PM.mp4', 'Official opening ceremony and inauguration of the Katsina State Institute of Technology and Management Career Services Centre.', 1, true),
        ('Career Services Centre Launch Highlights', 'https://res.cloudinary.com/njlhwruu/video/upload/v1791260396/WhatsApp_Video_2026-09-29_at_6.53.05_PM.mp4', 'Highlights, guest speeches, and student orientation at the KSITM Career Services Centre inaugural ceremony.', 2, true);
    `);
    console.log("Seeded 2 launch event videos into database");
  } else {
    console.log("Launch event videos already exist, count:", existingVideos[0].count);
  }

  console.log("\n=== Verification ===");
  const galleryCount = await retry(() => sql`SELECT count(*)::int as count FROM gallery_item;`);
  const employerCount = await retry(() => sql`SELECT count(*)::int as count FROM employer;`);
  const jobCount = await retry(() => sql`SELECT count(*)::int as count FROM job;`);
  const testimonialCount = await retry(() => sql`SELECT count(*)::int as count FROM testimonial;`);
  const videoCount = await retry(() => sql`SELECT count(*)::int as count FROM event_video;`);
  console.log("Verification via singular views:");
  console.log("- gallery_item view count:", galleryCount[0].count);
  console.log("- employer view count:", employerCount[0].count);
  console.log("- job view count:", jobCount[0].count);
  console.log("- testimonial view count:", testimonialCount[0].count);
  console.log("- event_video view count:", videoCount[0].count);
}

main().catch(console.error);
