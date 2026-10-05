import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

const dbUrlKsitm = process.env.DATABASE_URL;
const dbUrlNeon = dbUrlKsitm.replace("/ksitmcareers", "/neondb");

const targets = [
  { name: "ksitmcareers", sql: neon(dbUrlKsitm) },
  { name: "neondb", sql: neon(dbUrlNeon) },
];

async function seedDemoAccounts() {
  const defaultPassword = "Password123!";
  const passwordHash = await hashPassword(defaultPassword);

  for (const { name, sql } of targets) {
    console.log(`\n--- Seeding Demo Accounts into ${name} ---`);

    // 1. Seed Demo Student: Amina Bello
    const studentEmail = "student@ksitmcareers.edu.ng";
    const regNumber = "KSITM/ND/STE/24/001";

    let studentUserId;
    const existingStudentUser = await sql`
      SELECT id FROM users WHERE email = ${studentEmail}
    `;

    if (existingStudentUser.length > 0) {
      studentUserId = existingStudentUser[0].id;
      await sql`
        UPDATE users 
        SET password_hash = ${passwordHash}, is_active = true, role = 'STUDENT'
        WHERE id = ${studentUserId}
      `;
      console.log(`Updated existing student user (${studentEmail}).`);
    } else {
      const [newUser] = await sql`
        INSERT INTO users (email, password_hash, role, is_active)
        VALUES (${studentEmail}, ${passwordHash}, 'STUDENT', true)
        RETURNING id;
      `;
      studentUserId = newUser.id;
      console.log(`Created student user (${studentEmail}).`);
    }

    // Student Profile
    let studentProfileId;
    const existingStudentProfile = await sql`
      SELECT id FROM student_profiles WHERE user_id = ${studentUserId}
    `;

    if (existingStudentProfile.length > 0) {
      studentProfileId = existingStudentProfile[0].id;
      await sql`
        UPDATE student_profiles
        SET reg_number = ${regNumber},
            full_name = 'Amina Bello',
            department = 'Software & Web Development',
            level = 'ND II',
            phone = '+234 803 123 4567'
        WHERE id = ${studentProfileId}
      `;
      console.log(`Updated student profile (${regNumber}).`);
    } else {
      const [newProfile] = await sql`
        INSERT INTO student_profiles (user_id, reg_number, full_name, department, level, phone)
        VALUES (${studentUserId}, ${regNumber}, 'Amina Bello', 'Software & Web Development', 'ND II', '+234 803 123 4567')
        RETURNING id;
      `;
      studentProfileId = newProfile.id;
      console.log(`Created student profile (${regNumber}).`);
    }

    // 2. Seed Career Services Entitlements for Student
    const services = await sql`SELECT id, slug FROM career_services`;
    for (const service of services) {
      const initialStatus = ["consultations", "resume", "training", "readiness"].includes(service.slug)
        ? "ACTIVE"
        : "LOCKED";
      
      const activatedAt = initialStatus === "ACTIVE" ? new Date() : null;
      const note = initialStatus === "ACTIVE" 
        ? "Core institutional service automatically provisioned upon student registration."
        : "Requires initial Career Assistant consultation and skills evaluation before unlock.";

      await sql`
        INSERT INTO student_service_entitlements (student_id, service_id, status, activated_at, recommendation_note)
        VALUES (${studentProfileId}, ${service.id}, ${initialStatus}, ${activatedAt}, ${note})
        ON CONFLICT (student_id, service_id) DO UPDATE
        SET status = EXCLUDED.status,
            activated_at = EXCLUDED.activated_at,
            recommendation_note = EXCLUDED.recommendation_note;
      `;
    }
    console.log(`Provisioned all 7 career service entitlements for student.`);

    // 3. Seed Demo Career Assistant (Staff): Malam Ibrahim Kabir
    const staffEmail = "assistant@ksitmcareers.edu.ng";
    const staffCode = "KSITM/STAFF/CA/001";
    let staffUserId;

    const existingStaffUser = await sql`
      SELECT id FROM users WHERE email = ${staffEmail}
    `;

    if (existingStaffUser.length > 0) {
      staffUserId = existingStaffUser[0].id;
      await sql`
        UPDATE users 
        SET password_hash = ${passwordHash}, is_active = true, role = 'STAFF'
        WHERE id = ${staffUserId}
      `;
      console.log(`Updated staff user (${staffEmail}).`);
    } else {
      const [newUser] = await sql`
        INSERT INTO users (email, password_hash, role, is_active)
        VALUES (${staffEmail}, ${passwordHash}, 'STAFF', true)
        RETURNING id;
      `;
      staffUserId = newUser.id;
      console.log(`Created staff user (${staffEmail}).`);
    }

    let staffProfileId;
    const existingStaffProfile = await sql`
      SELECT id FROM staff_profiles WHERE user_id = ${staffUserId}
    `;

    if (existingStaffProfile.length > 0) {
      staffProfileId = existingStaffProfile[0].id;
      await sql`
        UPDATE staff_profiles
        SET full_name = 'Malam Ibrahim Kabir',
            staff_code = ${staffCode},
            designation = 'Senior Career Guidance Officer',
            can_manage_appointments = true,
            can_manage_services = true
        WHERE id = ${staffProfileId}
      `;
      console.log(`Updated staff profile (${staffCode}).`);
    } else {
      const [newStaff] = await sql`
        INSERT INTO staff_profiles (user_id, full_name, staff_code, designation, can_manage_appointments, can_manage_services)
        VALUES (${staffUserId}, 'Malam Ibrahim Kabir', ${staffCode}, 'Senior Career Guidance Officer', true, true)
        RETURNING id;
      `;
      staffProfileId = newStaff.id;
      console.log(`Created staff profile (${staffCode}).`);
    }

    // 4. Seed Demo Super Admin
    const adminEmail = "admin@ksitmcareers.edu.ng";
    const existingAdminUser = await sql`
      SELECT id FROM users WHERE email = ${adminEmail}
    `;

    if (existingAdminUser.length > 0) {
      await sql`
        UPDATE users 
        SET password_hash = ${passwordHash}, is_active = true, role = 'SUPER_ADMIN'
        WHERE id = ${existingAdminUser[0].id}
      `;
      console.log(`Updated admin user (${adminEmail}).`);
    } else {
      await sql`
        INSERT INTO users (email, password_hash, role, is_active)
        VALUES (${adminEmail}, ${passwordHash}, 'SUPER_ADMIN', true);
      `;
      console.log(`Created admin user (${adminEmail}).`);
    }

    // 5. Seed a Sample Consultation Request for the Student
    const existingReq = await sql`
      SELECT id FROM consultation_requests WHERE student_id = ${studentProfileId} LIMIT 1
    `;
    let reqId;
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (existingReq.length === 0) {
      const [newReq] = await sql`
        INSERT INTO consultation_requests (student_id, category, reason, preferred_date, preferred_time_slot, status, student_notes, reviewed_by_staff_id)
        VALUES (
          ${studentProfileId},
          'Internship Guidance & SIWES',
          'Seeking structured career advice regarding 6-month SIWES industrial internship opportunities in software engineering.',
          ${tomorrowStr},
          '10:00 - 10:30 AM',
          'SCHEDULED',
          'Student is preparing tech portfolio and seeking Katsina/Abuja placements.',
          ${staffProfileId}
        )
        RETURNING id;
      `;
      reqId = newReq.id;
      console.log("Seeded sample consultation request.");
    } else {
      reqId = existingReq[0].id;
    }

    // 6. Seed a Confirmed Appointment
    const existingAppt = await sql`
      SELECT id FROM appointments WHERE student_id = ${studentProfileId} LIMIT 1
    `;
    if (existingAppt.length === 0 && reqId) {
      const scheduledStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      scheduledStart.setHours(10, 0, 0, 0);
      const scheduledEnd = new Date(scheduledStart.getTime() + 30 * 60 * 1000);

      await sql`
        INSERT INTO appointments (
          consultation_request_id, student_id, staff_id,
          scheduled_start, scheduled_end, status,
          meeting_location, student_visible_notes, internal_staff_notes
        )
        VALUES (
          ${reqId}, ${studentProfileId}, ${staffProfileId},
          ${scheduledStart}, ${scheduledEnd}, 'SCHEDULED',
          'Career Services Centre, Room 104, Main Campus, KSITM',
          'Please bring your current resume draft and a brief portfolio summary of web projects completed.',
          'Focus on matching student with verified tech internship partners.'
        );
      `;
      console.log("Seeded sample confirmed appointment.");
    }
  }

  console.log("\n========================================================");
  console.log("DEMO ACCOUNTS READY ACROSS BOTH DATABASES!");
  console.log("========================================================");
}

seedDemoAccounts().catch(console.error);
