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

    // 4. Virtual internships table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS virtual_internships (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        slug text NOT NULL UNIQUE,
        organization_name text NOT NULL,
        department text NOT NULL DEFAULT 'ALL',
        level text NOT NULL DEFAULT 'ALL',
        duration text NOT NULL DEFAULT '4 Weeks',
        difficulty text NOT NULL DEFAULT 'INTERMEDIATE',
        banner_url text,
        summary text NOT NULL,
        description text NOT NULL,
        learning_objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
        tasks_deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
        skills text,
        is_published boolean NOT NULL DEFAULT true,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // 5. Virtual internship enrollments & submissions table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS virtual_internship_enrollments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        internship_id uuid NOT NULL REFERENCES virtual_internships(id) ON DELETE CASCADE,
        student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        assigned_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        assignment_note text,
        status text NOT NULL DEFAULT 'ASSIGNED',
        enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
        started_at timestamp with time zone,
        submitted_at timestamp with time zone,
        reviewed_at timestamp with time zone,
        reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        staff_feedback text,
        grade_score text,
        outcome_type text NOT NULL DEFAULT 'TEXT',
        outcome_title text,
        outcome_text text,
        outcome_url text,
        outcome_file_url text,
        outcome_file_name text,
        outcome_metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT student_internship_unique UNIQUE (student_id, internship_id)
      );
    `);

    // 6. Partner employers table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS partner_employers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        industry text NOT NULL DEFAULT 'Technology',
        partnership_tier text NOT NULL DEFAULT 'RECRUITING_PARTNER',
        contact_person text,
        contact_email text,
        contact_phone text,
        address text,
        website_url text,
        logo_url text,
        description text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // 7. Job postings table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS job_postings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        slug text NOT NULL UNIQUE,
        employer_id uuid REFERENCES partner_employers(id) ON DELETE SET NULL,
        company_name text NOT NULL,
        company_logo_url text,
        department text NOT NULL DEFAULT 'ALL',
        nature_of_work text NOT NULL DEFAULT 'Full-Time',
        duration text NOT NULL DEFAULT 'Permanent',
        vacancies_count integer NOT NULL DEFAULT 1,
        salary_range text,
        location text NOT NULL DEFAULT 'Katsina, Nigeria',
        summary text NOT NULL,
        description text NOT NULL,
        requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
        responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
        skills text,
        application_deadline timestamp with time zone,
        contact_email text,
        application_url text,
        is_published boolean NOT NULL DEFAULT true,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // 8. Employer engagement & job recommendations / supervision table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS job_recommendations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
        student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
        recommended_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        recommender_name text NOT NULL DEFAULT 'Career Staff',
        recommender_designation text,
        recommendation_reason text NOT NULL,
        supervisor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        supervisor_name text,
        status text NOT NULL DEFAULT 'RECOMMENDED',
        supervision_notes text,
        status_update_reason text,
        start_date timestamp with time zone,
        end_date timestamp with time zone,
        performance_rating integer,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT job_student_recommendation_unique UNIQUE (job_id, student_id)
      );
    `);

    // Create helpful indices
    await sql.query(`CREATE INDEX IF NOT EXISTS employability_resources_cat_idx ON employability_resources (category);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS student_occurrences_student_idx ON student_occurrences (student_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS student_occurrences_cat_idx ON student_occurrences (category);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS virtual_internships_slug_idx ON virtual_internships (slug);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS virtual_internships_dept_idx ON virtual_internships (department);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS internship_enrollments_student_idx ON virtual_internship_enrollments (student_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS internship_enrollments_internship_idx ON virtual_internship_enrollments (internship_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS internship_enrollments_status_idx ON virtual_internship_enrollments (status);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS partner_employers_slug_idx ON partner_employers (slug);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS job_postings_slug_idx ON job_postings (slug);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS job_postings_dept_idx ON job_postings (department);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS job_postings_nature_idx ON job_postings (nature_of_work);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS job_rec_job_idx ON job_recommendations (job_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS job_rec_student_idx ON job_recommendations (student_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS job_rec_status_idx ON job_recommendations (status);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS job_rec_supervisor_idx ON job_recommendations (supervisor_user_id);`);

    // 9. Employer onboarding, trust verification and dashboard account columns
    await sql.query(`ALTER TABLE partner_employers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL;`);
    await sql.query(`ALTER TABLE partner_employers ADD COLUMN IF NOT EXISTS registration_number text;`);
    await sql.query(`ALTER TABLE partner_employers ADD COLUMN IF NOT EXISTS official_email text;`);
    await sql.query(`ALTER TABLE partner_employers ADD COLUMN IF NOT EXISTS contact_designation text;`);
    await sql.query(`ALTER TABLE partner_employers ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'VERIFIED';`);
    await sql.query(`ALTER TABLE partner_employers ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;`);
    await sql.query(`ALTER TABLE partner_employers ADD COLUMN IF NOT EXISTS verified_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL;`);
    await sql.query(`ALTER TABLE partner_employers ADD COLUMN IF NOT EXISTS trust_badges jsonb NOT NULL DEFAULT '[]'::jsonb;`);

    await sql.query(`ALTER TABLE job_recommendations ADD COLUMN IF NOT EXISTS employer_feedback text;`);
    await sql.query(`ALTER TABLE job_recommendations ADD COLUMN IF NOT EXISTS employer_status text;`);

    await sql.query(`CREATE INDEX IF NOT EXISTS partner_employers_user_idx ON partner_employers (user_id);`);
    await sql.query(`CREATE INDEX IF NOT EXISTS partner_employers_verif_idx ON partner_employers (verification_status);`);
  });

  console.log("Database DDL migration completed successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
