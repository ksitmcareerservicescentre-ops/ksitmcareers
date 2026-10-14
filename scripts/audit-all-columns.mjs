import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const tables = [
    "student_profiles",
    "staff_profiles",
    "users",
    "student_master_list",
    "partner_employers",
    "job_postings",
    "job_recommendations",
    "virtual_internships",
    "virtual_internship_enrollments",
    "learning_modules",
    "module_assignments",
    "career_services",
    "student_service_entitlements",
    "appointments",
    "appointment_history",
    "consultation_requests",
    "assessments",
    "assessment_questions",
    "assessment_attempts",
    "assessment_responses",
    "training_categories",
    "training_videos",
    "employability_resources",
    "leadership_profiles",
    "gallery_items",
    "announcements",
    "testimonials",
    "launch_event_videos",
    "audit_logs",
    "notifications",
    "student_occurrences",
    "employers",
  ];

  console.log("Auditing table columns in neondb...");
  for (const t of tables) {
    const cols = await sql.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = '${t}'
      ORDER BY ordinal_position
    `);
    console.log(`\nTable: ${t} (${cols.length} columns)`);
    console.log(cols.map(c => c.column_name).join(", "));
  }
}

main().catch(console.error);
