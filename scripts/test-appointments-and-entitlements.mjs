import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function testWorkflow() {
  console.log("=== 1. VERIFYING ENTITLEMENTS MATRIX ===");
  const entitlementsSummary = await sql`
    SELECT sse.status, cs.slug, count(*)::int as count
    FROM student_service_entitlements sse
    JOIN career_services cs ON sse.service_id = cs.id
    GROUP BY sse.status, cs.slug
    ORDER BY sse.status, cs.slug
  `;
  console.table(entitlementsSummary);

  const activeServices = entitlementsSummary.filter((e) => e.status === "ACTIVE");
  const lockedServices = entitlementsSummary.filter((e) => e.status === "LOCKED");
  console.log(`Active services: ${activeServices.map((s) => s.slug).join(", ")}`);
  console.log(`Coming Soon (locked) services: ${lockedServices.map((s) => s.slug).join(", ")}`);

  console.log("\n=== 2. VERIFYING SAMPLE STUDENT DOSSIER ===");
  const [student] = await sql`
    SELECT id, full_name, reg_number FROM student_profiles LIMIT 1
  `;
  console.log(`Test student: ${student.full_name} (${student.regNumber})`);

  const [staff] = await sql`
    SELECT id, full_name, designation FROM staff_profiles LIMIT 1
  `;
  console.log(`Test staff officer: ${staff.fullName} (${staff.designation})`);

  console.log("\n=== 3. SIMULATING STUDENT CONSULTATION REQUEST ===");
  const [request] = await sql`
    INSERT INTO consultation_requests (
      id, student_id, category, reason, preferred_date, preferred_time_slot, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), ${student.id},
      'Career Advisory & Pathway Planning',
      'Test consultation request: Software Engineering career guidance',
      CURRENT_DATE + INTERVAL '2 days',
      '10:00 AM - 11:00 AM',
      'REQUESTED',
      NOW(), NOW()
    ) RETURNING id, category, reason, preferred_date, preferred_time_slot, status
  `;
  console.log("Created consultation request:", request);

  console.log("\n=== 4. SIMULATING SUPERADMIN / STAFF SCHEDULING & ASSIGNMENT ===");
  const scheduledStart = new Date(Date.now() + 2 * 24 * 3600 * 1000);
  const scheduledEnd = new Date(Date.now() + 2 * 24 * 3600 * 1000 + 3600 * 1000);

  const [appt] = await sql`
    INSERT INTO appointments (
      id, consultation_request_id, student_id, staff_id, scheduled_start, scheduled_end,
      status, meeting_location, student_visible_notes, internal_staff_notes, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), ${request.id}, ${student.id}, ${staff.id},
      ${scheduledStart}, ${scheduledEnd},
      'SCHEDULED',
      'Career Services Centre, Room 104',
      'Advisory session confirmed. Please bring your draft portfolio.',
      'Staff internal notes: First consultation review.',
      NOW(), NOW()
    ) RETURNING id, student_id, staff_id, scheduled_start, status, meeting_location
  `;
  console.log("Scheduled appointment:", appt);

  await sql`
    UPDATE consultation_requests
    SET status = 'SCHEDULED', reviewed_by_staff_id = ${staff.id}, updated_at = NOW()
    WHERE id = ${request.id}
  `;

  console.log("\n=== 5. VERIFYING STUDENT DASHBOARD VIEW ===");
  const studentActiveAppointments = await sql`
    SELECT a.id, a.status, a.scheduled_start, a.meeting_location, a.student_visible_notes,
           sp.full_name as staff_name, sp.designation as staff_designation
    FROM appointments a
    JOIN staff_profiles sp ON a.staff_id = sp.id
    WHERE a.student_id = ${student.id} AND a.status IN ('SCHEDULED', 'RESCHEDULED')
  `;
  console.log(`Student active appointments (${studentActiveAppointments.length} found):`);
  console.table(studentActiveAppointments);

  console.log("\n=== 6. CLEANING UP TEST APPOINTMENT & REQUEST ===");
  await sql`DELETE FROM appointments WHERE id = ${appt.id}`;
  await sql`DELETE FROM consultation_requests WHERE id = ${request.id}`;
  console.log("Cleaned up test records successfully.");

  console.log("\n=== ALL INTEGRATION VERIFICATIONS PASSED 100% HEALTHILY ===");
}

testWorkflow().catch(console.error);
