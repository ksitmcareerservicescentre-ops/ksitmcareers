import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const sql = neon(process.env.DATABASE_URL);

async function hashPassword(password) {
  const salt = "d96627c1c5a6a9c6e2a06301988e4f80";
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function reconcile() {
  console.log("=== RECONCILING PROFILES & SYSTEM ACCOUNTS IN NEONDB ===");
  const defaultHash = await hashPassword("12345678");

  // 1. Fetch career services for entitlement provisioning
  const services = await sql`SELECT id, slug FROM career_services`;
  console.log(`Found ${services.length} career services for entitlements.`);

  // 2. Fix all STUDENT users missing student_profiles
  const studentUsers = await sql`
    SELECT u.id, u.email, sp.id as profile_id
    FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    WHERE u.role = 'STUDENT'
  `;

  for (const su of studentUsers) {
    if (!su.profile_id) {
      console.log(`Fixing missing student_profile for: ${su.email} (${su.id})`);
      
      // Check master list
      const [master] = await sql`
        SELECT * FROM student_master_list 
        WHERE registered_user_id = ${su.id} 
           OR lower(reg_number) = lower(${su.email.split('@')[0]})
        LIMIT 1
      `;

      let regNumber, fullName, department, level, phone, masterId;
      if (master) {
        regNumber = master.reg_number;
        fullName = master.full_name || `${master.first_name} ${master.last_name}`;
        department = master.department || "Computer Software Engineering";
        level = master.level || "National Diploma I (ND 1)";
        phone = master.phone;
        masterId = master.id;
        console.log(`  -> Linked to master record: [${regNumber}] ${fullName}`);
      } else {
        // Generate clean attributes
        const prefix = su.email.split('@')[0];
        const cleanName = prefix
          .replace(/[._0-9]+/g, ' ')
          .trim()
          .replace(/\b\w/g, l => l.toUpperCase()) || "Student Scholar";
        regNumber = `KSITM/ND/STE/24/${su.id.slice(0, 4).toUpperCase()}`;
        fullName = cleanName;
        department = "Computer Software Engineering";
        level = "National Diploma I (ND 1)";
        phone = null;
        masterId = null;
        console.log(`  -> Auto-generated profile: [${regNumber}] ${fullName}`);
      }

      // Insert profile
      const [newProf] = await sql`
        INSERT INTO student_profiles (
          user_id, master_record_id, reg_number, full_name, department, level, phone
        ) VALUES (
          ${su.id}, ${masterId}, ${regNumber}, ${fullName}, ${department}, ${level}, ${phone}
        )
        RETURNING id
      `;

      // Provision initial entitlements
      for (const svc of services) {
        const isImmediatelyActive = [
          "consultations",
          "career-counseling",
          "employability-skills-training",
          "training",
          "ai-career-assistant",
        ].some((key) => svc.slug.includes(key));

        const status = isImmediatelyActive ? "ACTIVE" : "LOCKED";
        const activatedAt = isImmediatelyActive ? new Date() : null;

        await sql`
          INSERT INTO student_service_entitlements (
            student_id, service_id, status, activated_at
          ) VALUES (
            ${newProf.id}, ${svc.id}, ${status}, ${activatedAt}
          )
          ON CONFLICT (student_id, service_id) DO NOTHING
        `;
      }
      console.log(`  ✓ Created student_profile and entitlements for ${su.email}`);
    }
  }

  // 3. Fix STAFF users missing staff_profiles
  const staffUsers = await sql`
    SELECT u.id, u.email, stp.id as profile_id
    FROM users u
    LEFT JOIN staff_profiles stp ON stp.user_id = u.id
    WHERE u.role = 'STAFF'
  `;

  for (const st of staffUsers) {
    if (!st.profile_id) {
      console.log(`Fixing missing staff_profile for: ${st.email}`);
      const prefix = st.email.split('@')[0];
      const cleanName = prefix
        .replace(/[._0-9]+/g, ' ')
        .trim()
        .replace(/\b\w/g, l => l.toUpperCase()) || "Career Officer";
      const staffCode = `KSITM/STF/${st.id.slice(0, 4).toUpperCase()}`;

      await sql`
        INSERT INTO staff_profiles (
          user_id, staff_code, full_name, designation
        ) VALUES (
          ${st.id}, ${staffCode}, ${cleanName}, 'Career Advisory & Placement Officer'
        )
      `;
      console.log(`  ✓ Created staff_profile for ${st.email}`);
    }
  }

  // 4. Ensure .gov.ng system accounts exist with 12345678 password
  // Standard system accounts:
  // - superadmin@ksitmcareers.gov.ng (SUPER_ADMIN)
  // - student1@ksitmcareers.gov.ng (STUDENT)
  // - careerofficer1@ksitmcareers.gov.ng (STAFF)
  // - employer1@ksitmcareers.gov.ng (EMPLOYER)

  console.log("\nEnsuring .gov.ng system accounts...");
  
  // Superadmin
  const [govAdmin] = await sql`SELECT id FROM users WHERE email = 'superadmin@ksitmcareers.gov.ng'`;
  if (!govAdmin) {
    await sql`
      INSERT INTO users (email, password_hash, role, is_active)
      VALUES ('superadmin@ksitmcareers.gov.ng', ${defaultHash}, 'SUPER_ADMIN', true)
      ON CONFLICT (email) DO NOTHING
    `;
    console.log("  ✓ Created superadmin@ksitmcareers.gov.ng");
  }

  // Careerofficer1
  const [govStaff] = await sql`SELECT id FROM users WHERE email = 'careerofficer1@ksitmcareers.gov.ng'`;
  let govStaffId = govStaff?.id;
  if (!govStaff) {
    const [insStaff] = await sql`
      INSERT INTO users (email, password_hash, role, is_active)
      VALUES ('careerofficer1@ksitmcareers.gov.ng', ${defaultHash}, 'STAFF', true)
      RETURNING id
    `;
    govStaffId = insStaff.id;
    await sql`
      INSERT INTO staff_profiles (user_id, staff_code, full_name, designation)
      VALUES (${govStaffId}, 'KSITM/STF/GOV01', 'Career Advisory Officer', 'Senior Career Services Officer')
      ON CONFLICT (user_id) DO NOTHING
    `;
    console.log("  ✓ Created careerofficer1@ksitmcareers.gov.ng with staff_profile");
  }

  // Student1
  const [govStu] = await sql`SELECT id FROM users WHERE email = 'student1@ksitmcareers.gov.ng'`;
  let govStuId = govStu?.id;
  if (!govStu) {
    const [insStu] = await sql`
      INSERT INTO users (email, password_hash, role, is_active)
      VALUES ('student1@ksitmcareers.gov.ng', ${defaultHash}, 'STUDENT', true)
      RETURNING id
    `;
    govStuId = insStu.id;
    const [insProf] = await sql`
      INSERT INTO student_profiles (user_id, reg_number, full_name, department, level)
      VALUES (${govStuId}, 'KSITM/ND/STE/24/001G', 'Amina Bello', 'Computer Software Engineering', 'National Diploma I (ND 1)')
      RETURNING id
    `;
    for (const svc of services) {
      const isImmediatelyActive = [
        "consultations",
        "career-counseling",
        "employability-skills-training",
        "training",
        "ai-career-assistant",
      ].some((key) => svc.slug.includes(key));
      await sql`
        INSERT INTO student_service_entitlements (student_id, service_id, status, activated_at)
        VALUES (${insProf.id}, ${svc.id}, ${isImmediatelyActive ? 'ACTIVE' : 'LOCKED'}, ${isImmediatelyActive ? new Date() : null})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log("  ✓ Created student1@ksitmcareers.gov.ng with student_profile & entitlements");
  }

  // Ensure password for all main system accounts is 12345678
  await sql`
    UPDATE users 
    SET password_hash = ${defaultHash} 
    WHERE email IN (
      'superadmin@ksitmcareers.gov.ng',
      'superadmin@ksitmcareers.edu.ng',
      'superadmin@ksitmcareers.org.ng',
      'admin@ksitmcareers.edu.ng',
      'student1@ksitmcareers.gov.ng',
      'student1@ksitmcareers.edu.ng',
      'student1@ksitmcareers.org.ng',
      'student2@ksitmcareers.edu.ng',
      'employer1@ksitmcareers.gov.ng',
      'careerofficer1@ksitmcareers.gov.ng',
      'careerofficer1@ksitmcareers.edu.ng',
      'careerofficer1@ksitmcareers.org.ng',
      'careerofficer2@ksitmcareers.edu.ng',
      'assistant@ksitmcareers.edu.ng'
    )
  `;
  console.log("  ✓ Synchronized 12345678 password for all primary accounts.");

  console.log("\n=== RECONCILIATION COMPLETE ===");
}

reconcile().catch(console.error);
