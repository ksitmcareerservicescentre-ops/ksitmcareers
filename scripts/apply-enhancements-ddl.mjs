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

async function runWithRetry(fn, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt === maxRetries) throw err;
      await new Promise((res) => setTimeout(res, 2000 * attempt));
    }
  }
}

async function main() {
  console.log("Connecting to Neon database and applying DDL...");

  await runWithRetry(async () => {
    // 1. Staff and student profile enhancements
    await sql.query(`ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS bio text;`);
    await sql.query(`ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS avatar_url text;`);
    await sql.query(`ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS linkedin_url text;`);
    await sql.query(`ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS phone text;`);

    await sql.query(`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS bio text;`);
    await sql.query(`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS avatar_url text;`);
    await sql.query(`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS linkedin_url text;`);

    // 2. Employability resources table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS employability_resources (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        category text NOT NULL,
        resource_type text NOT NULL DEFAULT 'DOCUMENT',
        resource_address text NOT NULL,
        uploader_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        uploader_name text NOT NULL,
        uploader_role text NOT NULL DEFAULT 'Career Officer',
        uploader_avatar_url text,
        uploader_bio text,
        uploader_linkedin text,
        why_shared text NOT NULL,
        how_to_use text NOT NULL,
        target_audience text NOT NULL DEFAULT 'All Students',
        is_published boolean NOT NULL DEFAULT true,
        view_count integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // 3. Student occurrences table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS student_occurrences (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        actor_name text NOT NULL DEFAULT 'Career Staff',
        category text NOT NULL,
        title text NOT NULL,
        description text NOT NULL,
        action_taken text,
        occurrence_date timestamp with time zone DEFAULT now() NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // Create helpful indices
    await sql.query(`CREATE INDEX IF NOT EXISTS employability_resources_cat_idx ON employability_resources (category);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS student_occurrences_student_idx ON student_occurrences (student_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS student_occurrences_cat_idx ON student_occurrences (category);`);
  });

  console.log("Database DDL migration completed successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
