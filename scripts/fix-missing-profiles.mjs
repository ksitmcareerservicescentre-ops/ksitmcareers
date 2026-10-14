import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function inspect() {
  const users = await sql`
    SELECT u.id, u.email, u.role, u.is_active, u.created_at
    FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    WHERE u.role = 'STUDENT' AND sp.id IS NULL
  `;
  console.log("Found", users.length, "STUDENT users missing student_profiles:");
  for (const u of users) {
    console.log(`- ID: ${u.id} | Email: ${u.email} | Created: ${u.created_at}`);
  }

  // Also check if any STAFF or EMPLOYER are missing profiles
  const staffNoProf = await sql`
    SELECT u.id, u.email, u.role 
    FROM users u
    LEFT JOIN staff_profiles stp ON stp.user_id = u.id
    WHERE u.role = 'STAFF' AND stp.id IS NULL
  `;
  console.log("\nSTAFF without staff_profiles:", staffNoProf);

  const empNoProf = await sql`
    SELECT u.id, u.email, u.role 
    FROM users u
    LEFT JOIN partner_employers pe ON pe.user_id = u.id
    WHERE u.role = 'EMPLOYER' AND pe.id IS NULL
  `;
  console.log("\nEMPLOYER without partner_employers:", empNoProf);
}

inspect().catch(console.error);
