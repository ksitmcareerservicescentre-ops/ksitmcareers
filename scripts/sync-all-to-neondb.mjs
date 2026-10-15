import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const userDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const ksitmDbUrl = process.env.KSITM_DATABASE_URL || userDbUrl;

const sqlNeon = neon(userDbUrl);
const sqlKsitm = neon(ksitmDbUrl);

async function retry(fn, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Retry ${i + 1}/${retries}: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function main() {
  console.log("==================================================================");
  console.log("SYNCHRONIZING NEONDB TO BE THE 100% SINGLE SOURCE OF TRUTH");
  console.log("Target database: neondb");
  console.log("==================================================================");

  // 1. Create missing tables in neondb
  console.log("\n[1/5] Creating missing tables in neondb...");

  await retry(() => sqlNeon.query(`
    CREATE TABLE IF NOT EXISTS student_master_list (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reg_number TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      middle_name TEXT,
      full_name TEXT NOT NULL,
      department TEXT,
      level TEXT,
      phone TEXT,
      is_registered BOOLEAN NOT NULL DEFAULT false,
      registered_at TIMESTAMP WITH TIME ZONE,
      registered_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `));

  await retry(() => sqlNeon.query(`
    CREATE TABLE IF NOT EXISTS employability_resources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      resource_type TEXT NOT NULL DEFAULT 'DOCUMENT',
      resource_address TEXT NOT NULL,
      uploader_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      uploader_name TEXT NOT NULL,
      uploader_role TEXT NOT NULL DEFAULT 'Career Officer',
      uploader_avatar_url TEXT,
      uploader_bio TEXT,
      uploader_linkedin TEXT,
      why_shared TEXT NOT NULL,
      how_to_use TEXT NOT NULL,
      target_audience TEXT NOT NULL DEFAULT 'All Students',
      is_published BOOLEAN NOT NULL DEFAULT true,
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `));

  await retry(() => sqlNeon.query(`
    CREATE TABLE IF NOT EXISTS student_occurrences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      actor_name TEXT NOT NULL DEFAULT 'Career Staff',
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      action_taken TEXT,
      occurrence_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `));

  await retry(() => sqlNeon.query(`
    CREATE TABLE IF NOT EXISTS virtual_internships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      organization_name TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'ALL',
      level TEXT NOT NULL DEFAULT 'ALL',
      duration TEXT NOT NULL DEFAULT '4 Weeks',
      difficulty TEXT NOT NULL DEFAULT 'INTERMEDIATE',
      banner_url TEXT,
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      learning_objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
      tasks_deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
      skills TEXT,
      is_published BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `));

  await retry(() => sqlNeon.query(`
    CREATE TABLE IF NOT EXISTS virtual_internship_enrollments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      internship_id UUID NOT NULL REFERENCES virtual_internships(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      assigned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      assignment_note TEXT,
      status TEXT NOT NULL DEFAULT 'ASSIGNED',
      enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      started_at TIMESTAMP WITH TIME ZONE,
      submitted_at TIMESTAMP WITH TIME ZONE,
      reviewed_at TIMESTAMP WITH TIME ZONE,
      reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      staff_feedback TEXT,
      grade_score TEXT,
      outcome_type TEXT NOT NULL DEFAULT 'TEXT',
      outcome_title TEXT,
      outcome_text TEXT,
      outcome_url TEXT,
      outcome_file_url TEXT,
      outcome_file_name TEXT,
      outcome_metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      CONSTRAINT student_internship_unique UNIQUE (student_id, internship_id)
    );
  `));

  await retry(() => sqlNeon.query(`
    CREATE TABLE IF NOT EXISTS partner_employers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      industry TEXT NOT NULL DEFAULT 'Technology',
      partnership_tier TEXT NOT NULL DEFAULT 'RECRUITING_PARTNER',
      contact_person TEXT,
      contact_designation TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      official_email TEXT,
      registration_number TEXT,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      verification_status TEXT NOT NULL DEFAULT 'VERIFIED',
      verified_at TIMESTAMP WITH TIME ZONE,
      verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      trust_badges JSONB NOT NULL DEFAULT '[]'::jsonb,
      address TEXT,
      website_url TEXT,
      logo_url TEXT,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `));

  await retry(() => sqlNeon.query(`
    CREATE TABLE IF NOT EXISTS job_postings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      employer_id UUID REFERENCES partner_employers(id) ON DELETE SET NULL,
      company_name TEXT NOT NULL,
      company_logo_url TEXT,
      department TEXT NOT NULL DEFAULT 'ALL',
      nature_of_work TEXT NOT NULL DEFAULT 'Full-Time',
      duration TEXT NOT NULL DEFAULT 'Permanent',
      vacancies_count INTEGER NOT NULL DEFAULT 1,
      salary_range TEXT,
      location TEXT NOT NULL DEFAULT 'Katsina, Nigeria',
      summary TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
      responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
      skills TEXT,
      application_deadline TIMESTAMP WITH TIME ZONE,
      contact_email TEXT,
      application_url TEXT,
      is_published BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `));

  await retry(() => sqlNeon.query(`
    CREATE TABLE IF NOT EXISTS job_recommendations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      recommended_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      recommender_name TEXT NOT NULL DEFAULT 'Career Staff',
      recommender_designation TEXT,
      recommendation_reason TEXT NOT NULL,
      supervisor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      supervisor_name TEXT,
      status TEXT NOT NULL DEFAULT 'RECOMMENDED',
      supervision_notes TEXT,
      status_update_reason TEXT,
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      performance_rating INTEGER,
      employer_feedback TEXT,
      employer_status TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      CONSTRAINT job_student_recommendation_unique UNIQUE (job_id, student_id)
    );
  `));

  await retry(() => sqlNeon.query(`
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
  `));

  await retry(() => sqlNeon.query(`
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
  `));

  // Add master_record_id column to student_profiles if missing
  try {
    await retry(() => sqlNeon.query(`
      ALTER TABLE student_profiles 
      ADD COLUMN IF NOT EXISTS master_record_id UUID REFERENCES student_master_list(id) ON DELETE SET NULL;
    `));
  } catch (e) {
    console.log("master_record_id column check:", e.message);
  }

  console.log("All tables created successfully in neondb.");

  // 2. Data Migration from ksitmcareers into neondb
  console.log("\n[2/5] Migrating data into neondb...");

  // Sync users (e.g., employer1@ksitmcareers.gov.ng)
  const ksitmUsers = await retry(() => sqlKsitm.query("SELECT * FROM users"));
  for (const u of ksitmUsers) {
    await retry(() => sqlNeon.query(
      `INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      [u.id, u.email, u.password_hash, u.role, u.is_active, u.created_at, u.updated_at]
    ));
  }
  console.log(`Synced users (${ksitmUsers.length} evaluated)`);

  // Sync gallery_items
  const ksitmGallery = await retry(() => sqlKsitm.query("SELECT * FROM gallery_items"));
  const currentNeonGallery = await retry(() => sqlNeon.query("SELECT count(*)::int as count FROM gallery_items"));
  if (currentNeonGallery[0].count === 0 && ksitmGallery.length > 0) {
    for (const g of ksitmGallery) {
      await retry(() => sqlNeon.query(
        `INSERT INTO gallery_items (id, title, caption, image_url, image_alt, display_order, is_published, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [g.id, g.title, g.caption, g.image_url, g.image_alt, g.display_order, g.is_published, g.created_at]
      ));
    }
  }
  console.log(`Synced gallery_items (${ksitmGallery.length} items)`);

  // Sync leadership_profiles
  const ksitmLeaders = await retry(() => sqlKsitm.query("SELECT * FROM leadership_profiles"));
  for (const l of ksitmLeaders) {
    await retry(() => sqlNeon.query(
      `INSERT INTO leadership_profiles (id, name, position, image_url, image_alt, summary, biography, display_order, is_published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [l.id, l.name, l.position, l.image_url, l.image_alt, l.summary, JSON.stringify(l.biography), l.display_order, l.is_published, l.created_at, l.updated_at]
    ));
  }
  console.log(`Synced leadership_profiles (${ksitmLeaders.length} items)`);

  // Sync announcements
  const ksitmAnnouncements = await retry(() => sqlKsitm.query("SELECT * FROM announcements"));
  for (const a of ksitmAnnouncements) {
    await retry(() => sqlNeon.query(
      `INSERT INTO announcements (id, title, summary, content, image_url, published_at, is_published, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [a.id, a.title, a.summary, a.content, a.image_url, a.published_at, a.is_published, a.created_at]
    ));
  }
  console.log(`Synced announcements (${ksitmAnnouncements.length} items)`);

  // Sync learning_modules
  const ksitmModules = await retry(() => sqlKsitm.query("SELECT * FROM learning_modules"));
  for (const m of ksitmModules) {
    await retry(() => sqlNeon.query(
      `INSERT INTO learning_modules (id, slug, title, content, is_published, version, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slug) DO NOTHING`,
      [m.id, m.slug, m.title, JSON.stringify(m.content), m.is_published, m.version, m.updated_at]
    ));
  }
  console.log(`Synced learning_modules (${ksitmModules.length} items)`);

  // Sync training_categories and training_videos
  const ksitmCategories = await retry(() => sqlKsitm.query("SELECT * FROM training_categories"));
  for (const c of ksitmCategories) {
    await retry(() => sqlNeon.query(
      `INSERT INTO training_categories (id, name, slug, description, display_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.slug, c.description, c.display_order, c.created_at]
    ));
  }
  const ksitmVideos = await retry(() => sqlKsitm.query("SELECT * FROM training_videos"));
  for (const v of ksitmVideos) {
    await retry(() => sqlNeon.query(
      `INSERT INTO training_videos (id, category_id, title, slug, description, video_provider, video_url, video_id, thumbnail_url, duration_minutes, instructor, display_order, is_published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (slug) DO NOTHING`,
      [v.id, v.category_id, v.title, v.slug, v.description, v.video_provider, v.video_url, v.video_id, v.thumbnail_url, v.duration_minutes, v.instructor, v.display_order, v.is_published, v.created_at, v.updated_at]
    ));
  }
  console.log(`Synced training videos and categories`);

  // Sync employability_resources
  const ksitmResources = await retry(() => sqlKsitm.query("SELECT * FROM employability_resources"));
  for (const r of ksitmResources) {
    await retry(() => sqlNeon.query(
      `INSERT INTO employability_resources (id, title, category, resource_type, resource_address, uploader_user_id, uploader_name, uploader_role, uploader_avatar_url, uploader_bio, uploader_linkedin, why_shared, how_to_use, target_audience, is_published, view_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.title, r.category, r.resource_type, r.resource_address, r.uploader_user_id, r.uploader_name, r.uploader_role, r.uploader_avatar_url, r.uploader_bio, r.uploader_linkedin, r.why_shared, r.how_to_use, r.target_audience, r.is_published, r.view_count, r.created_at, r.updated_at]
    ));
  }
  console.log(`Synced employability_resources`);

  // Sync student_master_list
  const ksitmMaster = await retry(() => sqlKsitm.query("SELECT * FROM student_master_list"));
  for (const m of ksitmMaster) {
    let neonUserId = null;
    if (m.registered_user_id) {
      const u = await retry(() => sqlKsitm.query(`SELECT email FROM users WHERE id = '${m.registered_user_id}'`));
      if (u && u[0]) {
        const nu = await retry(() => sqlNeon.query(`SELECT id FROM users WHERE email = '${u[0].email}'`));
        if (nu && nu[0]) neonUserId = nu[0].id;
      }
    }

    await retry(() => sqlNeon.query(
      `INSERT INTO student_master_list (id, reg_number, first_name, last_name, middle_name, full_name, department, level, phone, is_registered, registered_at, registered_user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (reg_number) DO UPDATE SET
         is_registered = EXCLUDED.is_registered,
         registered_user_id = EXCLUDED.registered_user_id`,
      [m.id, m.reg_number, m.first_name, m.last_name, m.middle_name, m.full_name, m.department, m.level, m.phone, m.is_registered, m.registered_at, neonUserId, m.created_at, m.updated_at]
    ));
  }
  console.log(`Synced student_master_list (${ksitmMaster.length} items)`);

  // Sync virtual_internships
  const ksitmInternships = await retry(() => sqlKsitm.query("SELECT * FROM virtual_internships"));
  for (const vi of ksitmInternships) {
    await retry(() => sqlNeon.query(
      `INSERT INTO virtual_internships (id, title, slug, organization_name, department, level, duration, difficulty, banner_url, summary, description, learning_objectives, tasks_deliverables, skills, is_published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (slug) DO NOTHING`,
      [vi.id, vi.title, vi.slug, vi.organization_name, vi.department, vi.level, vi.duration, vi.difficulty, vi.banner_url, vi.summary, vi.description, JSON.stringify(vi.learning_objectives), JSON.stringify(vi.tasks_deliverables), vi.skills, vi.is_published, vi.created_at, vi.updated_at]
    ));
  }
  console.log(`Synced virtual_internships (${ksitmInternships.length} items)`);

  // Sync partner_employers (KSITM Careers)
  const ksitmPartners = await retry(() => sqlKsitm.query("SELECT * FROM partner_employers"));
  for (const p of ksitmPartners) {
    let neonUserId = null;
    if (p.official_email) {
      const nu = await retry(() => sqlNeon.query(`SELECT id FROM users WHERE email = '${p.official_email}'`));
      if (nu && nu[0]) neonUserId = nu[0].id;
    }

    await retry(() => sqlNeon.query(
      `INSERT INTO partner_employers (id, name, slug, industry, partnership_tier, contact_person, contact_designation, contact_email, contact_phone, official_email, registration_number, user_id, verification_status, verified_at, verified_by_user_id, trust_badges, address, website_url, logo_url, description, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         contact_designation = EXCLUDED.contact_designation,
         contact_person = EXCLUDED.contact_person,
         official_email = EXCLUDED.official_email,
         user_id = EXCLUDED.user_id`,
      [p.id, p.name, p.slug, p.industry, p.partnership_tier, p.contact_person, p.contact_designation, p.contact_email, p.contact_phone, p.official_email, p.registration_number, neonUserId, p.verification_status, p.verified_at, null, JSON.stringify(p.trust_badges), p.address, p.website_url, p.logo_url, p.description, p.is_active, p.created_at, p.updated_at]
    ));
  }
  console.log(`Synced partner_employers`);

  // Sync employers (legacy table)
  const ksitmEmployers = await retry(() => sqlKsitm.query("SELECT * FROM employers"));
  for (const emp of ksitmEmployers) {
    await retry(() => sqlNeon.query(
      `INSERT INTO employers (id, name, industry, website_url, description, location, is_partner, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         industry = EXCLUDED.industry`,
      [emp.id, emp.name, emp.industry, emp.website_url, emp.description, emp.location, emp.is_partner, emp.is_active, emp.created_at]
    ));
  }
  console.log(`Synced employers table`);

  // Sync job_postings
  const ksitmJobs = await retry(() => sqlKsitm.query("SELECT * FROM job_postings"));
  for (const j of ksitmJobs) {
    await retry(() => sqlNeon.query(
      `INSERT INTO job_postings (id, title, slug, employer_id, company_name, company_logo_url, department, nature_of_work, duration, vacancies_count, salary_range, location, summary, description, requirements, responsibilities, skills, application_deadline, contact_email, application_url, is_published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
       ON CONFLICT (slug) DO UPDATE SET
         company_name = EXCLUDED.company_name`,
      [j.id, j.title, j.slug, j.employer_id, j.company_name, j.company_logo_url, j.department, j.nature_of_work, j.duration, j.vacancies_count, j.salary_range, j.location, j.summary, j.description, JSON.stringify(j.requirements), JSON.stringify(j.responsibilities), j.skills, j.application_deadline, j.contact_email, j.application_url, j.is_published, j.created_at, j.updated_at]
    ));
  }
  console.log(`Synced job_postings`);

  // Sync testimonials
  const ksitmTestimonials = await retry(() => sqlKsitm.query("SELECT * FROM testimonials"));
  for (const t of ksitmTestimonials) {
    await retry(() => sqlNeon.query(
      `INSERT INTO testimonials (id, name, role, quote, rating, avatar_initials, is_published, display_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [t.id, t.name, t.role, t.quote, t.rating, t.avatar_initials, t.is_published, t.display_order, t.created_at, t.updated_at]
    ));
  }
  console.log(`Synced testimonials`);

  // Sync launch_event_videos
  const ksitmVideosEvent = await retry(() => sqlKsitm.query("SELECT * FROM launch_event_videos"));
  for (const lev of ksitmVideosEvent) {
    await retry(() => sqlNeon.query(
      `INSERT INTO launch_event_videos (id, title, video_url, description, display_order, is_published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [lev.id, lev.title, lev.video_url, lev.description, lev.display_order, lev.is_published, lev.created_at, lev.updated_at]
    ));
  }
  console.log(`Synced launch_event_videos`);

  // 3. Create views in neondb
  console.log("\n[3/5] Creating database views in neondb...");
  await retry(() => sqlNeon.query(`CREATE OR REPLACE VIEW gallery_item AS SELECT * FROM gallery_items;`));
  await retry(() => sqlNeon.query(`CREATE OR REPLACE VIEW employer AS SELECT * FROM partner_employers;`));
  await retry(() => sqlNeon.query(`CREATE OR REPLACE VIEW job AS SELECT * FROM job_postings;`));
  await retry(() => sqlNeon.query(`CREATE OR REPLACE VIEW internship AS SELECT * FROM virtual_internships;`));
  await retry(() => sqlNeon.query(`CREATE OR REPLACE VIEW service AS SELECT * FROM career_services;`));
  await retry(() => sqlNeon.query(`CREATE OR REPLACE VIEW testimonial AS SELECT * FROM testimonials;`));
  await retry(() => sqlNeon.query(`CREATE OR REPLACE VIEW event_video AS SELECT * FROM launch_event_videos;`));
  console.log("Created views: gallery_item, employer, job, internship, service, testimonial, event_video");

  // 4. Verify user edit in neondb
  console.log("\n[4/5] Checking user's customized data in neondb...");
  const userServices = await retry(() => sqlNeon.query("SELECT slug, title FROM career_services WHERE slug = 'consultations'"));
  console.log("Current consultations title in neondb:", userServices[0]?.title);

  // 5. Audit all row counts in neondb
  console.log("\n[5/5] Final Table Audit in neondb:");
  const tables = await retry(() => sqlNeon.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"));
  const report = {};
  for (const t of tables) {
    const res = await retry(() => sqlNeon.query(`SELECT count(*)::int as count FROM "${t.table_name}"`));
    report[t.table_name] = res[0].count;
  }
  console.log(JSON.stringify(report, null, 2));

  console.log("\n==================================================================");
  console.log("NEONDB IS NOW 100% POPULATED AS THE SINGLE SOURCE OF TRUTH!");
  console.log("==================================================================");
}

main().catch(console.error);
