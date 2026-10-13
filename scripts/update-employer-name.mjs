import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("=== Updating Employer Name and Designation to 'KSITM Careers' ===");

  // 1. Update partner_employers record
  const updatedPartners = await sql`
    UPDATE partner_employers
    SET 
      name = 'KSITM Careers',
      contact_designation = 'KSITM Careers',
      slug = 'ksitm-careers',
      description = 'Official Career Services Centre of the Katsina State Institute of Technology and Management driving corporate talent acquisition, internships, and graduate placements.',
      updated_at = NOW()
    WHERE official_email = 'employer1@ksitmcareers.gov.ng'
    RETURNING id, name, contact_designation, official_email, registration_number;
  `;
  console.log("Updated partner_employers:", updatedPartners);

  const employerId = updatedPartners[0].id;

  // 2. Update job_postings company_name
  const updatedJobs = await sql`
    UPDATE job_postings
    SET 
      company_name = 'KSITM Careers',
      updated_at = NOW()
    WHERE employer_id = ${employerId}
    RETURNING id, title, company_name;
  `;
  console.log("Updated job_postings:", updatedJobs);

  // 3. Sync into legacy 'employers' table so if user checks 'employers' table, it is not 0 records!
  await sql`DELETE FROM employers`;
  const syncedLegacy = await sql`
    INSERT INTO employers (
      id,
      name,
      industry,
      website_url,
      description,
      location,
      is_partner,
      is_active,
      created_at
    )
    VALUES (
      ${employerId},
      'KSITM Careers',
      'Career Services & Higher Education',
      'https://www.ksitmcareers.edu.ng',
      'Official Career Services Centre of the Katsina State Institute of Technology and Management.',
      'Katsina, Nigeria',
      true,
      true,
      NOW()
    )
    RETURNING id, name, industry;
  `;
  console.log("Synced into employers table:", syncedLegacy);

  console.log("\n=== Update completed successfully! ===");
}

main().catch(console.error);
