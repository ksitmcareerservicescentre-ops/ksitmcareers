# Phase 2 Report — Database Architecture

Completed 3 October 2026. **Stopped before Phase 3.**

## Summary of Achievements

1. **Neon Project Inspection & Configuration:**
   - Existing Neon project inspected: `ksitmcareer` (ID: `weathered-silence-59036384`, Region: `aws-eu-central-1`).
   - Renamed project safely from legacy singular `ksitmcareer` to `ksitmcareers` via Neon CLI (`neon projects update`).
   - Production branch confirmed: `production` (`br-snowy-water-b29plopo`).
   - Existing database `neondb` inspected and verified to contain 0 tables; completely preserved.
   - Created target database `ksitmcareers` with owner `neondb_owner`.
   - Verified connectivity and pooled connection string via `@neondatabase/serverless`.

2. **Technology Selection & Architecture:**
   - **ORM:** Drizzle ORM (`drizzle-orm` + `drizzle-kit`).
   - **Driver:** `@neondatabase/serverless` (Neon HTTP & WebSocket driver).
   - **Rationale:** Zero engine binary overhead, TypeScript strict-mode native, maximum compatibility with Next.js 16 Turbopack and Vercel serverless/edge environments.

3. **Domain Model & Schema Implementation (`src/db/schema.ts`):**
   - 34 relational tables designed and implemented with explicit primary keys, foreign keys, cascading deletion rules, unique constraints, and search indexes:
     - **Identity & RBAC:** `users` (roles: `STUDENT`, `STAFF`, `SUPER_ADMIN`), `student_profiles` (unique registration numbers, academic level/department), `staff_profiles` (staff codes, granular permission flags), `sessions` (token hash, TTL expiry).
     - **Career Services & Entitlements:** `career_services` (registered services catalog), `student_service_entitlements` (individual statuses: `LOCKED`, `ACTIVE`, `PAUSED`, `COMPLETED`), `service_entitlement_history` (comprehensive audit trail with staff reason and timestamp).
     - **Consultations & Appointments:** `consultation_requests` (student reason, preferred window, review status), `appointments` (scheduled times, location, student visible vs. internal staff notes), `appointment_history` (status/reschedule tracking).
     - **Structured Resume Builder:** `resume_profiles`, `resume_education`, `resume_experience`, `resume_skills`, `resume_certifications`, `resume_projects` (relational, structured records with display ordering; never unstructured blobs).
     - **Employability Training:** `training_categories`, `training_videos` (YouTube video ID parsing, metadata, published state), `student_training_progress` (completion status).
     - **Mentorship:** `mentors` (profiles, specializations, mentee limits), `mentorship_requests`, `mentorship_assignments` (status tracking).
     - **Opportunities & Employers:** `employers` (partner profiles), `opportunities` (virtual internships, jobs, career events).
     - **Assessments & AI Boundary:** `assessments`, `assessment_questions` (typed questions, JSONB options), `assessment_attempts` (scores, human recommendations, isolated AI feedback field), `assessment_responses`.
     - **CMS Content:** `leadership_profiles`, `gallery_items`, `announcements`, `social_links` (prepared for Super Admin management without code changes).
     - **System Governance:** `audit_logs` (actor, action, entity, JSONB metadata, IP), `notifications` (in-app student/staff alerts).

4. **Migrations & Seeding:**
   - Versioned migration generated: `src/db/migrations/0000_foamy_black_queen.sql`.
   - Migration executed successfully against Neon database `ksitmcareers` via `drizzle-kit migrate`.
   - Seed script `src/db/seed.ts` created and executed to populate the 7 base institutional career services (`consultations`, `mentorship`, `resume`, `training`, `internships`, `employers`, `readiness`). No fake users or mock data seeded into production.

5. **Security & Configuration:**
   - `.env.example` updated with variable name `DATABASE_URL=`.
   - `.env.local` configured with the secure pooled connection string (verified ignored by Git).
   - `.neon` tool directory ignored in `.gitignore`.

6. **Quality Verification:**
   - `npm run lint`: **PASSED** (0 errors, 0 warnings).
   - `npm run typecheck`: **PASSED** (all Next.js route types & Drizzle schema types validated).
   - `npm run build`: **PASSED** (production build succeeded with Turbopack).
   - `npm test`: **PASSED** (23 passed, 1 intentional skip).
   - `npm run format:check`: **PASSED** (all files formatted with Prettier).

## Next Step

Awaiting owner review and explicit approval for **Phase 3: Authentication + Authorization (RBAC)**.
