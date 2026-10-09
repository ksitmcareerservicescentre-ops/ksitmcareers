# Student Modules

Super Admin → Workspace menu → Modules has two top views:

- **Module Manager**: select a module, edit/import its JSON data, publish it, search students and assign it. A student preview appears alongside the editor on wide screens.
- **Preview**: try Start, Save progress and Complete with the same question renderer and validation used by students. Preview never writes student records.

After applying the migration, choose **Create module templates** once. This creates eight editable drafts: Job readiness assessments, Employability skills training, Resume builder, Virtual Internship, Employer engagement, Job board, Career Fair Management and Appointment Scheduler. Repeating initialization preserves existing definitions.

## Scope & Pedagogical Architecture

This is the shared activity/content and assignment workflow for all eight student modules. Each module is structured upon higher-education pedagogical frameworks and current industry/career-tech standards:

1. **Job readiness assessments**: Grounded in the **NACE 8 Career Readiness Competencies** (National Association of Colleges and Employers) and Bandura's Career Self-Efficacy Theory. Features multi-dimensional 1–5 competency self-ratings, diagnostic readiness staging, and 30-day gap remediation planning.
2. **Employability skills training**: Grounded in **Kolb's Experiential Learning Cycle** and the **STAR Method** (Situation, Task, Action, Result). Scaffolds concrete workplace challenges, behavioral action articulation, measurable results, and interview delivery confidence.
3. **Resume builder**: Grounded in **Applicant Tracking System (ATS)** parsing standards and **Google's XYZ Formula** (*Accomplished [X] measured by [Y] by doing [Z]*). Guides professional summary framing, ATS keyword inventories, quantified impact bullets, and parsing quality audit.
4. **Virtual Internship**: Grounded in the **Transformative Experiential Learning Model (TELM)** and Daubney's remote placement KASE framework (modeled after Forage). Structures client brief analysis, domain specialization, remote collaboration tooling, deliverable submission, and asynchronous problem-solving reflection.
5. **Employer engagement**: Grounded in **Granovetter's Strength of Weak Ties** and the **Informational Interviewing Methodology** (Bolles). Guides target organization research, 30-second elevator pitch formulation, strategic inquiry questions, and 24-hour follow-up protocol.
6. **Job board**: Grounded in **Cognitive Information Processing (CIP)** Career Theory and pipeline tracking models. Deconstructs job postings for core ATS keywords, qualification alignment pitches, application customization notes, and multi-stage status management.
7. **Career Fair Management**: Grounded in **Goffman's Impression Management** and the **3-Phase Event Lifecycle** (Pre-fair targeting, booth pitch delivery & recruiter dialogue, and 24–48 hour follow-up conversion).
8. **Appointment Scheduler**: Grounded in **Solution-Focused Career Counseling (SFCC)** and **SMART Action Planning** (Locke & Latham). Features pre-appointment intake agenda setting, materials prep, adviser feedback synthesis, and time-bound accountability milestones.

Each module includes curated, verified HTTPS resources pointing to institutional career guides, NACE benchmarks, and practical toolkits.

Limits: 100 KB JSON, 100 questions, 30 resources, 10,000 characters per answer. Questions support `TEXT`, `MULTIPLE_CHOICE` (2–20 options), and `SCALE_1_5` (with visual proficiency hints).

## 2026 Grid Cards & UI Architecture

Both the Super Admin workspace and Student Dashboard implement modern-classic 2026 UI/UX design standards:
- **Curriculum Modules Grid**: The 8 modules are presented in a responsive 4-column luxury card grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).
- **Specific Requirements Displayed on Each Card**:
  - Bespoke category SVG icon in luminous amber container
  - Category pill (e.g., `DIAGNOSTIC CORE`, `SKILL DEVELOPMENT`, `CAREER ASSETS`, `EXPERIENTIAL LEARNING`, `PROFESSIONAL NETWORKING`, `SEARCH & STRATEGY`, `EVENT STRATEGY`, `ADVISORY COACHING`)
  - Status indicator (Published with glowing emerald dot vs Draft Template with amber dot) and version chip (`v1`, `v2`)
  - Module title and evidence-based pedagogical framework badge
  - Specific Requirements container in obsidian frosted glass detailing:
    * Question prompts count & required count
    * Question format types (`TEXT`, `MULTIPLE_CHOICE`, `SCALE_1_5`)
    * Curated framework resource guides count
    * Estimated duration / time commitment (e.g. `15–20 Mins`)
    * Target outcome / competency goal
- **Executive Metrics Strip**: 4 luxury stat cards summarizing Total Curriculum (8 Modules), Live Published count, Draft Templates count, and Core Pedagogical Frameworks.
- **Active Workspace Focus**: Clicking any card smoothly focuses the workbench on that module with glowing border highlight, glow line, and checkmark badge. A synchronized combobox ensures seamless keyboard accessibility and automated test integration.

## Assignment records

Assignments are unique per student/module. Duplicate assignment does not reset work. Each assignment snapshots the title, content and module version, and records the assigning administrator and optional note. Editing or unpublishing a definition does not rewrite existing assignments.

Students use Dashboard → My Modules. Opening the page does not start a module; clicking **Start module** does. States are Assigned → In progress → Completed. `started_at` is set once. Required responses are checked before completion. Completed work is read-only. Optimistic version checks prevent stale windows from overwriting newer saves.

Admin records can be filtered by student and status, with 25 records per page, ordered by most recent start time, with unstarted records last. The detail view includes student profile fields, assignment note, assigning administrator, assignment/start/completion/last-save dates, content version and saved answers. Audit logs record changes. Students cannot access other students' records, and all management actions verify Super Admin on the server.

## Migration and activation

`src/db/migrations/0001_ambitious_morlun.sql` adds only `learning_modules` and `module_assignments`, their indexes, foreign keys, uniqueness and lifecycle constraints. It does not alter existing student/service records. Drizzle configuration prefers `DATABASE_URL_UNPOOLED` and removes Neon's `-pooler` hostname suffix for migration connections.

1. Authenticate the Neon CLI and create an isolated branch of the existing project for migration testing.
2. Set the test branch connection locally, keeping credentials out of Git, and run `npm run db:migrate`.
3. Verify assignment/start/save/completion against that branch. Confirm the existing initial migration is recorded in Drizzle's migration journal before applying migrations to an existing database; do not rerun the initial schema manually.
4. Apply the same migration to the intended hosted database and deploy the application together. Then initialize, configure and publish the module templates through Super Admin.

The hosted migration has been successfully applied to both `ksitmcareers` and `neondb` databases. Both databases have 36 tables (+2 new tables).

## Checks

- `npm run test:modules`: real migration and server-action lifecycle tests in isolated embedded Postgres (PGlite). Authentication and cache revalidation are test fixtures; real data validation, SQL, ownership filtering and persistence are exercised.
- `npm run build`, `npm run typecheck`, `npm run lint`.
- After building, `npm run test:modules:ui`: desktop/mobile component browser tests with fixture action responses. These test the editor, preview, invalid JSON, required answers, assignment controls and repeated filtering; they do not claim hosted database end-to-end coverage. Screenshots are saved under `artifacts/`.

No test credentials or student data are added to the hosted database by these checks.
