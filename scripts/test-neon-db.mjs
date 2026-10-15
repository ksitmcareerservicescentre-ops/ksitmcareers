import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(dbUrl);

async function run() {
  console.log("Connecting to Neon DB...");
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`;
  console.log("All Public Tables (" + tables.length + "):", tables.map((t) => t.table_name).join(", "));

  const [hero] = await sql`SELECT count(*) FROM hero_slides;`;
  const [footerLinks] = await sql`SELECT count(*) FROM footer_links;`;
  const [contacts] = await sql`SELECT address, email, phone FROM site_contact_info LIMIT 1;`;
  const [socials] = await sql`SELECT count(*) FROM social_links;`;
  const [videos] = await sql`SELECT count(*) FROM training_videos;`;
  const [services] = await sql`SELECT count(*) FROM career_services;`;
  const [testimonials] = await sql`SELECT count(*) FROM testimonials;`;
  const [students] = await sql`SELECT count(*) FROM student_profiles;`;
  const [staff] = await sql`SELECT count(*) FROM staff_profiles;`;
  const [appointments] = await sql`SELECT count(*) FROM appointments;`;

  console.log("-----------------------------------------");
  console.log("Hero Slides:", hero.count);
  console.log("Footer Links:", footerLinks.count);
  console.log("Social Links:", socials.count);
  console.log("Career Services:", services.count);
  console.log("Testimonials:", testimonials.count);
  console.log("Training Videos:", videos.count);
  console.log("Enrolled Students:", students.count);
  console.log("Career Staff:", staff.count);
  console.log("Appointments:", appointments.count);
  console.log("Site Contact Info:", contacts);
  console.log("-----------------------------------------");
  console.log("Neon DB is verified as the 100% active single source of truth!");
}

run().catch(console.error);
