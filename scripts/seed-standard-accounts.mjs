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

async function seedAccounts() {
  const passwordPlain = "12345678";
  const passwordHash = await hashPassword(passwordPlain);

  for (const { name, sql } of targets) {
    console.log(`\n=============================================`);
    console.log(`Setting up accounts on: ${name}`);
    console.log(`=============================================`);

    // 1. Super Admin (1 account)
    const superAdminEmail = "superadmin@ksitmcareers.edu.ng";
    const existingAdmin = await sql`SELECT id FROM users WHERE email = ${superAdminEmail}`;
    if (existingAdmin.length > 0) {
      await sql`
        UPDATE users 
        SET password_hash = ${passwordHash}, is_active = true, role = 'SUPER_ADMIN'
        WHERE id = ${existingAdmin[0].id}
      `;
      console.log(`✓ Updated Super Admin: ${superAdminEmail}`);
    } else {
      await sql`
        INSERT INTO users (email, password_hash, role, is_active)
        VALUES (${superAdminEmail}, ${passwordHash}, 'SUPER_ADMIN', true)
      `;
      console.log(`✓ Created Super Admin: ${superAdminEmail}`);
    }

    // Also ensure admin@ksitmcareers.edu.ng has password 12345678
    await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, is_active = true, role = 'SUPER_ADMIN'
      WHERE email = 'admin@ksitmcareers.edu.ng'
    `;

    // 2. Career Officers (2 accounts: careerofficer1 and careerofficer2)
    const careerOfficers = [
      {
        email: "careerofficer1@ksitmcareers.edu.ng",
        code: "KSITM/STAFF/CO/001",
        name: "Malam Nura Sadiq",
        designation: "Career Services Coordinator",
      },
      {
        email: "careerofficer2@ksitmcareers.edu.ng",
        code: "KSITM/STAFF/CO/002",
        name: "Malam Abubakar Abdu",
        designation: "Career Guidance Officer",
      },
    ];

    for (const co of careerOfficers) {
      let userId;
      const existingUser = await sql`SELECT id FROM users WHERE email = ${co.email}`;
      if (existingUser.length > 0) {
        userId = existingUser[0].id;
        await sql`
          UPDATE users 
          SET password_hash = ${passwordHash}, is_active = true, role = 'STAFF'
          WHERE id = ${userId}
        `;
      } else {
        const [newUser] = await sql`
          INSERT INTO users (email, password_hash, role, is_active)
          VALUES (${co.email}, ${passwordHash}, 'STAFF', true)
          RETURNING id;
        `;
        userId = newUser.id;
      }

      const existingProfile = await sql`SELECT id FROM staff_profiles WHERE user_id = ${userId}`;
      if (existingProfile.length > 0) {
        await sql`
          UPDATE staff_profiles
          SET full_name = ${co.name},
              staff_code = ${co.code},
              designation = ${co.designation},
              can_manage_appointments = true,
              can_manage_services = true,
              can_manage_training = true,
              can_manage_mentorship = true
          WHERE id = ${existingProfile[0].id}
        `;
      } else {
        await sql`
          INSERT INTO staff_profiles (
            user_id, full_name, staff_code, designation,
            can_manage_appointments, can_manage_services, can_manage_training, can_manage_mentorship
          )
          VALUES (
            ${userId}, ${co.name}, ${co.code}, ${co.designation},
            true, true, true, true
          )
        `;
      }
      console.log(`✓ Configured Career Officer: ${co.email} (${co.name})`);
    }

    // 3. Students (2 accounts: student1 and student2)
    const students = [
      {
        email: "student1@ksitmcareers.edu.ng",
        regNumber: "KSITM/ND/STE/24/001",
        fullName: "Amina Bello",
        department: "Software & Web Development",
        level: "National Diploma II (ND 2)",
        phone: "+234 803 123 4567",
      },
      {
        email: "student2@ksitmcareers.edu.ng",
        regNumber: "KSITM/ND/STE/24/002",
        fullName: "Usman Danladi",
        department: "Networking & System Security",
        level: "National Diploma I (ND 1)",
        phone: "+234 803 987 6543",
      },
    ];

    const services = await sql`SELECT id, slug FROM career_services`;

    for (const st of students) {
      // 1. Resolve or create user
      let userId;
      const existingUser = await sql`SELECT id FROM users WHERE email = ${st.email}`;
      if (existingUser.length > 0) {
        userId = existingUser[0].id;
        await sql`
          UPDATE users 
          SET password_hash = ${passwordHash}, is_active = true, role = 'STUDENT'
          WHERE id = ${userId}
        `;
      } else {
        const [newUser] = await sql`
          INSERT INTO users (email, password_hash, role, is_active)
          VALUES (${st.email}, ${passwordHash}, 'STUDENT', true)
          RETURNING id;
        `;
        userId = newUser.id;
      }

      // 2. Clear any old conflicting profile on this reg_number if attached to a different user
      const conflictingProfile = await sql`
        SELECT id, user_id FROM student_profiles 
        WHERE reg_number = ${st.regNumber} AND user_id != ${userId}
      `;
      if (conflictingProfile.length > 0) {
        await sql`DELETE FROM student_profiles WHERE id = ${conflictingProfile[0].id}`;
      }

      // 3. Upsert student_profile for this user
      let profileId;
      const existingProfile = await sql`SELECT id FROM student_profiles WHERE user_id = ${userId}`;
      if (existingProfile.length > 0) {
        profileId = existingProfile[0].id;
        await sql`
          UPDATE student_profiles
          SET reg_number = ${st.regNumber},
              full_name = ${st.fullName},
              department = ${st.department},
              level = ${st.level},
              phone = ${st.phone}
          WHERE id = ${profileId}
        `;
      } else {
        const [newProfile] = await sql`
          INSERT INTO student_profiles (user_id, reg_number, full_name, department, level, phone)
          VALUES (${userId}, ${st.regNumber}, ${st.fullName}, ${st.department}, ${st.level}, ${st.phone})
          RETURNING id;
        `;
        profileId = newProfile.id;
      }

      // 4. Entitlements
      for (const service of services) {
        const initialStatus = ["consultations", "resume", "training", "readiness"].includes(service.slug)
          ? "ACTIVE"
          : "LOCKED";
        const activatedAt = initialStatus === "ACTIVE" ? new Date() : null;
        const note = initialStatus === "ACTIVE" 
          ? "Core institutional service automatically provisioned upon student registration."
          : "Requires initial Career Officer consultation and skills evaluation.";

        await sql`
          INSERT INTO student_service_entitlements (student_id, service_id, status, activated_at, recommendation_note)
          VALUES (${profileId}, ${service.id}, ${initialStatus}, ${activatedAt}, ${note})
          ON CONFLICT (student_id, service_id) DO UPDATE
          SET status = EXCLUDED.status,
              activated_at = EXCLUDED.activated_at,
              recommendation_note = EXCLUDED.recommendation_note;
        `;
      }

      console.log(`✓ Configured Student: ${st.email} (${st.regNumber} - ${st.fullName})`);
    }
  }

  console.log("\n============================================================");
  console.log("ALL 5 REQUESTED ACCOUNTS ARE READY WITH PASSWORD: 12345678");
  console.log("============================================================");
}

seedAccounts().catch(console.error);
