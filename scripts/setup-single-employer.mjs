import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

async function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("=== Setting up single sample employer (employer1@ksitmcareers.gov.ng) with 1 full-time JOB ===");

  const targetEmail = "employer1@ksitmcareers.gov.ng";
  const targetPassword = "12345678";
  const passwordHash = await hashPassword(targetPassword);

  // 1. Delete all existing job recommendations
  await sql`DELETE FROM job_recommendations`;
  console.log("Cleared old job recommendations.");

  // 2. Delete all existing job postings
  await sql`DELETE FROM job_postings`;
  console.log("Cleared old job postings.");

  // 3. Delete all existing partner_employers
  await sql`DELETE FROM partner_employers`;
  console.log("Cleared old partner_employers.");

  // 4. Delete any old users with role 'EMPLOYER' or with email matching target
  await sql`DELETE FROM users WHERE role = 'EMPLOYER' OR lower(email) = ${targetEmail}`;
  console.log("Cleared old employer user accounts.");

  // 5. Create new employer user: employer1@ksitmcareers.gov.ng
  const [createdUser] = await sql`
    INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)
    VALUES (${targetEmail}, ${passwordHash}, 'EMPLOYER', true, NOW(), NOW())
    RETURNING id, email, role;
  `;
  console.log("Created user:", createdUser);

  // 6. Create the single official partner employer record
  const [employerRecord] = await sql`
    INSERT INTO partner_employers (
      name,
      slug,
      industry,
      partnership_tier,
      registration_number,
      official_email,
      contact_person,
      contact_designation,
      contact_email,
      contact_phone,
      address,
      website_url,
      description,
      verification_status,
      verified_at,
      trust_badges,
      user_id,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      'Katsina State ICT Directorate',
      'katsina-state-ict-directorate',
      'Public Sector & Digital Infrastructure',
      'STRATEGIC',
      'KTG-ICT-2024',
      ${targetEmail},
      'Engr. Aliyu Sanusi',
      'Director of Digital Services & Training',
      ${targetEmail},
      '+234 803 200 4500',
      'State Secretariat Complex, Katsina, Katsina State',
      'https://katsina.gov.ng',
      'Official state technology agency driving e-governance infrastructure, government cloud networks, and technical career opportunities for KSITM technology graduates.',
      'VERIFIED',
      NOW(),
      ${JSON.stringify(["State Government Agency", "Official MOA Signed", "Public Sector Sponsor", "CAC Verified"])},
      ${createdUser.id},
      true,
      NOW(),
      NOW()
    )
    RETURNING id, name, slug, official_email;
  `;
  console.log("Created partner employer:", employerRecord);

  // 7. Upload 1 full-time JOB opening for this employer
  const [job] = await sql`
    INSERT INTO job_postings (
      title,
      slug,
      employer_id,
      company_name,
      company_logo_url,
      department,
      nature_of_work,
      duration,
      vacancies_count,
      salary_range,
      location,
      summary,
      description,
      requirements,
      responsibilities,
      skills,
      contact_email,
      is_published,
      created_at,
      updated_at
    )
    VALUES (
      'Junior Cloud Infrastructure & Digital Systems Engineer',
      'junior-cloud-infrastructure-digital-systems-engineer',
      ${employerRecord.id},
      ${employerRecord.name},
      null,
      'Computer Software Engineering',
      'Full-Time (Hybrid)',
      'Permanent',
      3,
      '₦180,000 - ₦240,000 / month',
      'Katsina State ICT Center, Katsina',
      'Full-time engineering role responsible for state portal infrastructure uptime, Linux cloud servers, network performance optimization, and institutional system integrity.',
      'The Katsina State ICT Directorate is recruiting high-potential KSITM graduates for the position of Junior Cloud Infrastructure & Digital Systems Engineer. In this full-time role, you will be embedded with the Directorate Core Infrastructure Team, configuring Linux servers, automating deployment pipelines, managing PostgreSQL database failovers, and ensuring 99.9% uptime across all state government digital services.',
      ${JSON.stringify([
        "National Diploma (ND) or Higher National Diploma (HND) in Computer Software Engineering, Networking, or Electrical Engineering from KSITM",
        "Demonstrated proficiency in Linux system administration (Ubuntu/CentOS), Bash scripting, and TCP/IP networking",
        "Hands-on experience with containerization (Docker) and database administration (PostgreSQL or MySQL)",
        "Proven diagnostic problem-solving abilities and adherence to institutional security guidelines"
      ])},
      ${JSON.stringify([
        "Manage, maintain, and monitor state government cloud servers and DNS configurations",
        "Execute automated system backups, patch installations, and security vulnerability remediations",
        "Collaborate with software engineers to deploy application updates and verify API uptime",
        "Document systems architecture diagrams and operational disaster recovery workflows"
      ])},
      'Linux Administration, Cloud Hosting, Docker, PostgreSQL, Network Security, Bash, DevOps',
      ${targetEmail},
      true,
      NOW(),
      NOW()
    )
    RETURNING id, title, nature_of_work, vacancies_count;
  `;
  console.log("Created uploaded JOB opening:", job);

  // 8. Link 1 recommended student to this job opening
  const students = await sql`SELECT id, full_name FROM student_profiles LIMIT 1`;
  const staff = await sql`SELECT user_id, full_name FROM staff_profiles LIMIT 1`;
  if (students.length > 0) {
    const student = students[0];
    const recommenderUserId = staff.length > 0 ? staff[0].user_id : null;
    const recommenderName = staff.length > 0 ? staff[0].full_name : "Malam Ibrahim Kabir";

    await sql`
      INSERT INTO job_recommendations (
        job_id,
        student_id,
        recommended_by_user_id,
        recommender_name,
        recommender_designation,
        recommendation_reason,
        supervisor_user_id,
        supervisor_name,
        status,
        employer_status,
        employer_feedback,
        created_at,
        updated_at
      )
      VALUES (
        ${job.id},
        ${student.id},
        ${recommenderUserId},
        ${recommenderName},
        'Senior Career Advisory Officer',
        'Exceptional technical rigor and top-tier score on the Job Readiness Benchmark. Candidate demonstrated outstanding Linux administration competencies, practical infrastructure troubleshooting skills, and exemplary dedication.',
        ${recommenderUserId},
        ${recommenderName},
        'RECOMMENDED',
        'Interview Scheduled',
        'Candidate shortlisted for technical assessment and formal onboarding interview.',
        NOW(),
        NOW()
      );
    `;
    console.log(`Created 1 recommendation for student ${student.full_name} on the job opening.`);
  }

  console.log("\n=== Job setup completed successfully! ===");
}

main().catch(console.error);
