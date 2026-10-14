import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function check() {
  const services = await sql`
    SELECT id, slug, title, summary, icon, display_order, is_active
    FROM career_services
    ORDER BY display_order ASC
  `;
  console.log("Services count:", services.length);
  console.log("Services:", services);

  const entitlements = await sql`
    SELECT status, COUNT(*) as count
    FROM student_service_entitlements
    GROUP BY status
  `;
  console.log("Entitlements status breakdown:", entitlements);

  const constraints = await sql`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'student_service_entitlements'::regclass
  `;
  console.log("Constraints:", constraints);
}

check().catch(console.error);
