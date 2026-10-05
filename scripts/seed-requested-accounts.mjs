import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const sql = neon(process.env.DATABASE_URL);
const password = process.env.SEED_PASSWORD || "12345678";
const domain = process.env.ACCOUNT_DOMAIN || "ksitmcareers.org.ng";

async function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(value, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function upsertUser({ email, role, fullName, profile }) {
  const passwordHash = await hashPassword(password);
  const [existing] = await sql`SELECT id FROM users WHERE lower(email) = lower(${email})`;
  let userId = existing?.id;

  if (userId) {
    await sql`UPDATE users SET password_hash = ${passwordHash}, role = ${role}, is_active = true, updated_at = now() WHERE id = ${userId}`;
  } else {
    const [created] = await sql`
      INSERT INTO users (email, password_hash, role, is_active)
      VALUES (${email}, ${passwordHash}, ${role}, true)
      RETURNING id
    `;
    userId = created.id;
  }

  if (role === "STUDENT") {
    const [student] = await sql`SELECT id FROM student_profiles WHERE user_id = ${userId}`;
    let studentId = student?.id;
    if (studentId) {
      await sql`
        UPDATE student_profiles
        SET reg_number = ${profile.regNumber}, full_name = ${fullName}, department = ${profile.department}, level = ${profile.level}, phone = ${profile.phone}, updated_at = now()
        WHERE id = ${studentId}
      `;
    } else {
      const [created] = await sql`
        INSERT INTO student_profiles (user_id, reg_number, full_name, department, level, phone)
        VALUES (${userId}, ${profile.regNumber}, ${fullName}, ${profile.department}, ${profile.level}, ${profile.phone})
        RETURNING id
      `;
      studentId = created.id;
    }

    const services = await sql`SELECT id, slug FROM career_services WHERE is_active = true`;
    for (const service of services) {
      const active = ["consultations", "resume", "training", "readiness"].includes(service.slug);
      await sql`
        INSERT INTO student_service_entitlements (student_id, service_id, status, activated_at, recommendation_note)
        VALUES (${studentId}, ${service.id}, ${active ? "ACTIVE" : "LOCKED"}, ${active ? new Date() : null}, ${active ? "Core service provisioned for the requested test account." : "Requires Career Officer assessment."})
        ON CONFLICT (student_id, service_id) DO UPDATE SET status = EXCLUDED.status, activated_at = EXCLUDED.activated_at, recommendation_note = EXCLUDED.recommendation_note, updated_at = now()
      `;
    }
  }

  if (role === "STAFF" || role === "SUPER_ADMIN") {
    const [staff] = await sql`SELECT id FROM staff_profiles WHERE user_id = ${userId}`;
    if (staff) {
      await sql`
        UPDATE staff_profiles
        SET full_name = ${fullName}, staff_code = ${profile.staffCode}, designation = ${profile.designation}, can_manage_appointments = true, can_manage_services = true, can_manage_training = true, can_manage_mentorship = true, updated_at = now()
        WHERE id = ${staff.id}
      `;
    } else {
      await sql`
        INSERT INTO staff_profiles (user_id, full_name, staff_code, designation, can_manage_appointments, can_manage_services, can_manage_training, can_manage_mentorship)
        VALUES (${userId}, ${fullName}, ${profile.staffCode}, ${profile.designation}, true, true, true, true)
      `;
    }
  }

  console.log(`Configured ${role}: ${email}`);
}

await upsertUser({
  email: `student1@${domain}`,
  role: "STUDENT",
  fullName: "Student One",
  profile: { regNumber: "KSITM/DEMO/STUDENT1", department: "Software & Web Development", level: "National Diploma II (ND 2)", phone: null },
});
await upsertUser({
  email: `careerofficer1@${domain}`,
  role: "STAFF",
  fullName: "Career Officer One",
  profile: { staffCode: "KSITM/STAFF/CO/ORG-001", designation: "Career Officer" },
});
await upsertUser({
  email: `superadmin@${domain}`,
  role: "SUPER_ADMIN",
  fullName: "KSITM Super Administrator",
  profile: { staffCode: "KSITM/ADMIN/ORG-001", designation: "Super Administrator" },
});
console.log(`Requested accounts are ready with the configured seed password. Domain: ${domain}`);
