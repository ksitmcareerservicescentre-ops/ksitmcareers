import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function reconcileEntitlements() {
  console.log("=== BATCH RECONCILING STUDENT SERVICE ENTITLEMENTS ===");

  // 1. Cross join insert missing entitlements in 1 fast query
  await sql`
    INSERT INTO student_service_entitlements (
      id, student_id, service_id, status, activated_at, created_at, updated_at
    )
    SELECT
      gen_random_uuid(),
      s.id,
      cs.id,
      CASE WHEN cs.slug != 'mentorship' THEN 'ACTIVE' ELSE 'LOCKED' END,
      CASE WHEN cs.slug != 'mentorship' THEN NOW() ELSE NULL END,
      NOW(),
      NOW()
    FROM student_profiles s
    CROSS JOIN career_services cs
    ON CONFLICT (student_id, service_id) DO NOTHING
  `;
  console.log("Missing entitlements ensured via CROSS JOIN.");

  // 2. Set all functional services to ACTIVE
  await sql`
    UPDATE student_service_entitlements
    SET status = 'ACTIVE',
        activated_at = COALESCE(activated_at, NOW()),
        updated_at = NOW()
    WHERE service_id IN (
      SELECT id FROM career_services WHERE slug != 'mentorship'
    )
  `;
  console.log("Functional services updated to ACTIVE.");

  // 3. Set mentorship to LOCKED (Coming Soon)
  await sql`
    UPDATE student_service_entitlements
    SET status = 'LOCKED',
        activated_at = NULL,
        updated_at = NOW()
    WHERE service_id IN (
      SELECT id FROM career_services WHERE slug = 'mentorship'
    )
  `;
  console.log("Mentorship set to LOCKED (Coming Soon).");

  const breakdown = await sql`
    SELECT sse.status, cs.slug, count(*)::int as count
    FROM student_service_entitlements sse
    JOIN career_services cs ON sse.service_id = cs.id
    GROUP BY sse.status, cs.slug
    ORDER BY sse.status, cs.slug
  `;
  console.log("Current Entitlements Status Breakdown:");
  console.table(breakdown);
}

reconcileEntitlements().catch(console.error);
