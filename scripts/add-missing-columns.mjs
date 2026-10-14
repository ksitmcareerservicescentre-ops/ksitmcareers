import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("=== Adding Missing Columns in neondb ===");

  // 1. student_profiles
  await sql.query(`
    ALTER TABLE student_profiles 
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
  `);
  console.log("Updated student_profiles: added bio, avatar_url, linkedin_url");

  // 2. staff_profiles
  await sql.query(`
    ALTER TABLE staff_profiles 
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT;
  `);
  console.log("Updated staff_profiles: added bio, avatar_url, linkedin_url, phone");

  console.log("\n=== Verifying columns in student_profiles ===");
  const spCols = await sql.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'student_profiles'
  `);
  console.log("student_profiles columns:", spCols.map(c => c.column_name).join(", "));

  console.log("\n=== Verifying columns in staff_profiles ===");
  const stCols = await sql.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'staff_profiles'
  `);
  console.log("staff_profiles columns:", stCols.map(c => c.column_name).join(", "));
}

main().catch(console.error);
