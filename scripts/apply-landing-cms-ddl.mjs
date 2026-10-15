import { Pool } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

async function run() {
  console.log("Applying Landing CMS DDL to Neon PostgreSQL...");

  await pool.query(`
    -- 1. Hero Slides
    CREATE TABLE IF NOT EXISTS "hero_slides" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" text,
      "subtitle" text,
      "image_url" text NOT NULL,
      "image_alt" text DEFAULT 'KSITM Hero Slide',
      "cta_text" text DEFAULT 'Get Started / Enrol Now',
      "cta_link" text DEFAULT '/register',
      "display_order" integer NOT NULL DEFAULT 0,
      "is_active" boolean NOT NULL DEFAULT true,
      "created_at" timestamp with time zone NOT NULL DEFAULT now(),
      "updated_at" timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS "hero_slides_active_idx" ON "hero_slides" ("is_active");
    CREATE INDEX IF NOT EXISTS "hero_slides_order_idx" ON "hero_slides" ("display_order");

    -- 2. Footer Links
    CREATE TABLE IF NOT EXISTS "footer_links" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "category" text NOT NULL,
      "label" text NOT NULL,
      "url" text NOT NULL,
      "is_external" boolean NOT NULL DEFAULT false,
      "display_order" integer NOT NULL DEFAULT 0,
      "is_active" boolean NOT NULL DEFAULT true,
      "created_at" timestamp with time zone NOT NULL DEFAULT now(),
      "updated_at" timestamp with time zone NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS "footer_links_category_idx" ON "footer_links" ("category");
    CREATE INDEX IF NOT EXISTS "footer_links_active_idx" ON "footer_links" ("is_active");
    CREATE INDEX IF NOT EXISTS "footer_links_order_idx" ON "footer_links" ("display_order");

    -- 3. Site Contact Info
    CREATE TABLE IF NOT EXISTS "site_contact_info" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "institution_name" text NOT NULL DEFAULT 'Katsina State Institute of Technology and Management',
      "centre_name" text NOT NULL DEFAULT 'Directorate of Career Services & Linkages',
      "address" text NOT NULL DEFAULT 'Room 1, Ground Floor, Block A, Katsina State Institute of Technology and Management, P.M.B. 2101, Abba Musa Rimi Way, Katsina, Katsina State',
      "email" text NOT NULL DEFAULT 'contact@ksitmcareers.edu.ng',
      "phone" text NOT NULL DEFAULT '09062125845',
      "phone_contact" text NOT NULL DEFAULT 'Nura Sadiq',
      "website_url" text NOT NULL DEFAULT 'https://www.ksitmcareers.edu.ng',
      "copyright_text" text DEFAULT '© 2026 KSITM Careers. All rights reserved. Built for student success.',
      "updated_at" timestamp with time zone NOT NULL DEFAULT now()
    );
  `);

  console.log("Tables verified. Checking initial seeds...");

  // Seed hero_slides if empty
  const heroCount = await pool.query("SELECT count(*)::int as count FROM hero_slides;");
  if (heroCount.rows[0].count === 0) {
    console.log("Seeding initial hero_slides...");
    await pool.query(`
      INSERT INTO hero_slides (title, subtitle, image_url, image_alt, display_order, is_active)
      VALUES
        ('Modern Computing & Software Engineering', 'Advancing Futures through World-Class Experiential Education', 'https://res.cloudinary.com/djkudkxmx/image/upload/v1790626126/screen_2_fcf81s.jpg', 'KSITM Digital Campus Screen 1', 1, true),
        ('Executive Career Guidance & Industry Linkages', 'Bridging the Gap Between Tertiary Academia and Enterprise Industry', 'https://res.cloudinary.com/djkudkxmx/image/upload/v1790626122/screen_1_dzwyjz.jpg', 'KSITM Digital Campus Screen 2', 2, true),
        ('Innovation, Research & Digital Employability', 'Equipping Katsina Scholars with High-Impact Global Competencies', 'https://res.cloudinary.com/djkudkxmx/image/upload/v1790626121/screen_3_gkjtrh.jpg', 'KSITM Digital Campus Screen 3', 3, true);
    `);
  }

  // Seed footer_links if empty
  const footerCount = await pool.query("SELECT count(*)::int as count FROM footer_links;");
  if (footerCount.rows[0].count === 0) {
    console.log("Seeding initial footer_links...");
    await pool.query(`
      INSERT INTO footer_links (category, label, url, is_external, display_order, is_active)
      VALUES
        ('SERVICES', 'Appointment Scheduler', '/services/consultations', false, 1, true),
        ('SERVICES', 'Resume Builder', '/services/resume', false, 2, true),
        ('SERVICES', 'Skills Training', '/services/training', false, 3, true),
        ('SERVICES', 'Virtual Internship', '/services/internships', false, 4, true),
        ('SERVICES', 'Job Board', '/dashboard/jobs', false, 5, true),
        ('SERVICES', 'Career Fairs & Expos', '/dashboard/career-fair', false, 6, true),
        ('RESOURCES', 'Student Portal', '/login', false, 1, true),
        ('RESOURCES', 'Create Account', '/register', false, 2, true),
        ('RESOURCES', 'Announcements', '/#updates', false, 3, true),
        ('RESOURCES', 'Campus Gallery', '/#gallery', false, 4, true),
        ('RESOURCES', 'Executive Leadership', '/#leaders', false, 5, true),
        ('RESOURCES', 'Advisory Support Desk', 'mailto:contact@ksitmcareers.edu.ng', true, 6, true);
    `);
  }

  // Seed site_contact_info if empty
  const contactCount = await pool.query("SELECT count(*)::int as count FROM site_contact_info;");
  if (contactCount.rows[0].count === 0) {
    console.log("Seeding initial site_contact_info...");
    await pool.query(`
      INSERT INTO site_contact_info (institution_name, centre_name, address, email, phone, phone_contact, website_url, copyright_text)
      VALUES (
        'Katsina State Institute of Technology and Management',
        'Directorate of Career Services & Linkages',
        'Room 1, Ground Floor, Block A, Katsina State Institute of Technology and Management, P.M.B. 2101, Abba Musa Rimi Way, Katsina, Katsina State',
        'contact@ksitmcareers.edu.ng',
        '09062125845',
        'Nura Sadiq',
        'https://www.ksitmcareers.edu.ng',
        '© 2026 KSITM Careers. All rights reserved. Built with dedication for student success.'
      );
    `);
  }

  // Seed social_links if empty
  const socialCount = await pool.query("SELECT count(*)::int as count FROM social_links;");
  if (socialCount.rows[0].count === 0) {
    console.log("Seeding initial social_links...");
    await pool.query(`
      INSERT INTO social_links (platform, url, is_active, display_order)
      VALUES
        ('YOUTUBE', 'https://www.youtube.com/@ksitmcareers', true, 1),
        ('INSTAGRAM', 'https://www.instagram.com/ksitmcarees', true, 2),
        ('X_TWITTER', 'https://x.com/ksitmcareers', true, 3),
        ('FACEBOOK', 'https://www.facebook.com/ksitmcareers', true, 4);
    `);
  }

  console.log("Landing CMS DDL & Initial Seeds Applied Successfully!");
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
