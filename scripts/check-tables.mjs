import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const partnerEmps = await sql`SELECT id, name, contact_person, contact_designation, official_email, registration_number, user_id FROM partner_employers`;
  console.log("partner_employers records:", partnerEmps);

  const oldEmps = await sql`SELECT * FROM employers`;
  console.log("employers records:", oldEmps);

  const jobs = await sql`SELECT id, title, company_name, employer_id FROM job_postings`;
  console.log("job_postings records:", jobs);
}

main().catch(console.error);
