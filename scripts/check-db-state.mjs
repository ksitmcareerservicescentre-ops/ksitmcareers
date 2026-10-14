import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const users = await sql`
    SELECT id, email, role, is_active 
    FROM users 
    WHERE email LIKE '%ksitm%' OR role IN ('SUPER_ADMIN', 'EMPLOYER', 'STAFF')
    ORDER BY role, email
  `;
  console.log("=== SYSTEM USERS ===");
  console.table(users);

  const emps = await sql`SELECT id, user_id, name, official_email, verification_status FROM partner_employers`;
  console.log("=== PARTNER EMPLOYERS ===");
  console.table(emps);
}

main().catch(console.error);
