import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function check() {
  const usersWithoutProfile = await sql`
    SELECT u.id, u.email, u.role, u.created_at
    FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    WHERE u.role = 'STUDENT' AND sp.id IS NULL
  `;
  console.log("Students without profiles:", usersWithoutProfile);

  // Check if their email or name is in student_master_list
  for (const u of usersWithoutProfile) {
    const byEmail = await sql`
      SELECT * FROM student_master_list 
      WHERE lower(reg_number) LIKE ${'%' + u.email.split('@')[0].toLowerCase() + '%'}
         OR lower(full_name) LIKE ${'%' + u.email.split('@')[0].toLowerCase() + '%'}
    `;
    console.log(`Master match for ${u.email}:`, byEmail);
  }
}

check().catch(console.error);
