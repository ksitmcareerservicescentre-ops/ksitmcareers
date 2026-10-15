import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL missing from .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

async function main() {
  console.log("Applying Career Fairs & Request DDL to database...");

  // 1. Career Fairs table
  await sql.query(`
    CREATE TABLE IF NOT EXISTS career_fairs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      slug text NOT NULL UNIQUE,
      theme text,
      description text NOT NULL,
      venue text NOT NULL DEFAULT 'KSITM Main Convocation Arena & Virtual Livestream',
      start_date timestamp with time zone NOT NULL,
      end_date timestamp with time zone NOT NULL,
      registration_deadline timestamp with time zone,
      banner_url text,
      target_audience text NOT NULL DEFAULT 'All Students & Alumni',
      status text NOT NULL DEFAULT 'UPCOMING',
      is_published boolean NOT NULL DEFAULT true,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  console.log("career_fairs table verified.");

  // 2. Career Fair Booths table
  await sql.query(`
    CREATE TABLE IF NOT EXISTS career_fair_booths (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      fair_id uuid NOT NULL REFERENCES career_fairs(id) ON DELETE CASCADE,
      employer_id uuid REFERENCES partner_employers(id) ON DELETE SET NULL,
      company_name text NOT NULL,
      booth_number text NOT NULL DEFAULT 'Booth 1',
      industry text NOT NULL DEFAULT 'Technology',
      website_url text,
      target_roles text,
      open_positions_count integer NOT NULL DEFAULT 1,
      virtual_meeting_url text,
      display_order integer NOT NULL DEFAULT 0,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
  console.log("career_fair_booths table verified.");

  // 3. Career Fair Registrations table
  await sql.query(`
    CREATE TABLE IF NOT EXISTS career_fair_registrations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      fair_id uuid NOT NULL REFERENCES career_fairs(id) ON DELETE CASCADE,
      student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      registration_number text NOT NULL,
      registered_at timestamp with time zone DEFAULT now() NOT NULL,
      attended boolean NOT NULL DEFAULT false,
      notes text,
      CONSTRAINT student_fair_unique UNIQUE (fair_id, student_id)
    );
  `);
  console.log("career_fair_registrations table verified.");

  // 4. Ensure indexes exist
  await sql.query(`CREATE INDEX IF NOT EXISTS career_fairs_slug_idx ON career_fairs (slug);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS career_fairs_status_idx ON career_fairs (status);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS career_fairs_published_idx ON career_fairs (is_published);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS career_fair_booths_fair_idx ON career_fair_booths (fair_id);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS career_fair_reg_fair_idx ON career_fair_registrations (fair_id);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS career_fair_reg_student_idx ON career_fair_registrations (student_id);`);

  console.log("Career Fairs DDL completed successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
