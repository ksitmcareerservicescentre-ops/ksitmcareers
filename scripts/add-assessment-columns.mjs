import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const dbUrlKsitm = process.env.DATABASE_URL;
const dbUrlNeon = dbUrlKsitm.replace("/ksitmcareers", "/neondb");

async function run() {
  for (const [name, url] of [["ksitmcareers", dbUrlKsitm], ["neondb", dbUrlNeon]]) {
    console.log(`Updating schema for ${name}...`);
    const sql = neon(url);
    await sql`ALTER TABLE assessments ADD COLUMN IF NOT EXISTS time_limit_minutes integer DEFAULT 30;`;
    await sql`ALTER TABLE assessments ADD COLUMN IF NOT EXISTS passing_score integer DEFAULT 60;`;
    await sql`ALTER TABLE assessments ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();`;
    console.log(`Schema successfully updated for ${name}!`);
  }
}

run().catch(console.error);
