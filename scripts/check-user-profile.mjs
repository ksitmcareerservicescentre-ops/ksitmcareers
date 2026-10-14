import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function check() {
  const sps = await sql`
    SELECT sp.id, sp.user_id, sp.reg_number, sp.full_name, u.email 
    FROM student_profiles sp 
    LEFT JOIN users u ON u.id = sp.user_id
  `;
  console.log("All student profiles count:", sps.length);
  for (const s of sps) {
    console.log(`  - [${s.reg_number}] ${s.full_name} | user_id: ${s.user_id} | email: ${s.email}`);
  }

  // Also check student_master_list columns
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'student_master_list'
  `;
  console.log("\nstudent_master_list columns:", cols.map(c => c.column_name));

  const masterList = await sql`SELECT * FROM student_master_list LIMIT 10`;
  console.log("\nsample master list records:", masterList);
}

check().catch(console.error);
