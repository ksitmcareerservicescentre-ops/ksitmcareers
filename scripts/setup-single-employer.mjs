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
  console.log("=== Setting up single sample employer: employer1@ksitmcareers.gov.ng ===");

  const targetEmail = "employer1@ksitmcareers.gov.ng";
  const targetPassword = "12345678";
  const passwordHash = await hashPassword(targetPassword);

  // 1. Delete all existing job recommendations for any previous jobs
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
      'Official state technology agency driving e-governance infrastructure, government cloud networks, and strategic technical internship pipelines for KSITM technology graduates.',
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

  // 7. Upload 1 internship for this employer in job_postings
  const [internship] = await sql`
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
      'Cloud Infrastructure & Digital Governance Internship',
      'cloud-infrastructure-digital-governance-internship',
      ${employerRecord.id},
      ${employerRecord.name},
      null,
      'Computer Software Engineering',
      'Internship',
      '3 Months (Renewable)',
      5,
      '₦60,000 / month Stipend',
      'Katsina State ICT Center, Katsina',
      'Hands-on technical internship program focusing on cloud server administration, public infrastructure monitoring, web service deployment, and state database administration.',
      'The Katsina State ICT Directorate offers this structured internship opportunity for top-performing KSITM students and recent alumni. Interns will work alongside government cloud engineers and DevOps mentors to manage state web portals, configure virtualized Linux servers, and participate in statewide e-governance automation deliverables.',
      ${JSON.stringify([
        "Enrolled in or graduate of KSITM Computer Software Engineering, Networking, or ICT program",
        "Demonstrated competence in Linux terminal operations, IP networking fundamentals, and database basics",
        "High personal integrity and commitment to official data confidentiality"
      ])},
      ${JSON.stringify([
        "Assist in maintaining and monitoring public cloud servers and government agency subdomains",
        "Deploy application updates and execute technical tests under staff supervision",
        "Document network configurations and participate in weekly technical reviews"
      ])},
      'Linux, Cloud Infrastructure, Docker, Networking, PostgreSQL, Bash, Cybersecurity',
      ${targetEmail},
      true,
      NOW(),
      NOW()
    )
    RETURNING id, title, nature_of_work, vacancies_count;
  `;
  console.log("Created uploaded internship:", internship);

  // 8. Optionally link 1 recommended student to this internship if any student exists
  const students = await sql`SELECT id, full_name FROM student_profiles LIMIT 1`;
  const staff = await sql`SELECT user_id, full_name FROM staff_profiles LIMIT 1`;
  if (students.length > 0) {
    const student = students[0];
    const recommenderUserId = staff.length > 0 ? staff[0].user_id : null;
    const recommenderName = staff.length > 0 ? staff[0].full_name : "Director of Career Services";

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
        ${internship.id},
        ${student.id},
        ${recommenderUserId},
        ${recommenderName},
        'Senior Career Advisory Officer',
        'Exceptional technical rigor and top-tier score on the Job Readiness Benchmark. Candidate demonstrated outstanding Linux administration competencies and strong work ethic in campus lab simulations.',
        ${recommenderUserId},
        ${recommenderName},
        'RECOMMENDED',
        'Interview Scheduled',
        'Reviewing candidate resume; scheduled for technical orientation.',
        NOW(),
        NOW()
      );
    `;
    console.log(`Created 1 sample recommendation for student ${student.full_name} on the internship.`);
  }

  console.log("\n=== Setup completed successfully! ===");
}

main().catch(console.error);
