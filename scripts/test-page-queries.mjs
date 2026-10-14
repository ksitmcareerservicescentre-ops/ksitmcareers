import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function testAllPageQueries() {
  console.log("--- 1. Testing Admin Page Queries ---");
  const officers = await sql`
    SELECT sp.id, sp.user_id, sp.full_name, sp.staff_code, sp.designation,
           sp.can_manage_appointments, sp.can_manage_services, sp.created_at,
           u.email, u.is_active
    FROM staff_profiles sp
    INNER JOIN users u ON sp.user_id = u.id
    ORDER BY sp.created_at DESC
  `;
  console.log(`Admin officers query passed: ${officers.length} rows`);

  const students = await sql`
    SELECT sp.id, sp.full_name, sp.reg_number, sp.department, sp.level,
           u.email, u.is_active, sp.avatar_url, sp.created_at
    FROM student_profiles sp
    INNER JOIN users u ON sp.user_id = u.id
    ORDER BY sp.created_at DESC
    LIMIT 10
  `;
  console.log(`Admin students query passed: ${students.length} rows`);

  console.log("--- 2. Testing Staff Page Queries ---");
  const staffApps = await sql`
    SELECT a.id, a.student_id, a.status, a.scheduled_start, a.meeting_location,
           a.internal_staff_notes, sp.full_name, sp.reg_number, sp.department,
           sp.level, sp.phone, u.email
    FROM appointments a
    INNER JOIN student_profiles sp ON a.student_id = sp.id
    INNER JOIN users u ON sp.user_id = u.id
    ORDER BY a.scheduled_start DESC
  `;
  console.log(`Staff appointments query passed: ${staffApps.length} rows`);

  console.log("--- 3. Testing Employer Page Queries ---");
  const emps = await sql`
    SELECT * FROM partner_employers WHERE official_email = 'employer1@ksitmcareers.gov.ng'
  `;
  console.log(`Employer query passed: ${emps.length} rows`);

  console.log("--- 4. Testing Student Entitlements Query ---");
  const [testStudent] = await sql`SELECT id FROM student_profiles LIMIT 1`;
  const entitlements = await sql`
    SELECT sse.id, sse.status, sse.activated_at, cs.title, cs.slug
    FROM student_service_entitlements sse
    INNER JOIN career_services cs ON sse.service_id = cs.id
    WHERE sse.student_id = ${testStudent.id}
    ORDER BY cs.display_order ASC
  `;
  console.log(`Student entitlements query passed: ${entitlements.length} rows`);

  console.log("=== ALL PAGE QUERIES PASSED HEALTHILY ===");
}

testAllPageQueries().catch(console.error);
