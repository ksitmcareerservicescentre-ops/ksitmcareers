import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const dbUrlKsitm = process.env.DATABASE_URL;
const dbUrlNeon = dbUrlKsitm.replace("/ksitmcareers", "/neondb");

const sqlKsitm = neon(dbUrlKsitm);
const sqlNeon = neon(dbUrlNeon);

async function sync() {
  console.log("Syncing audit_logs...");
  const logs = await sqlKsitm`SELECT * FROM audit_logs`;
  for (const l of logs) {
    await sqlNeon`
      INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (${l.id}, ${l.actor_id}, ${l.action}, ${l.entity_type}, ${l.entity_id}, ${l.details}, ${l.ip_address}, ${l.created_at})
      ON CONFLICT (id) DO NOTHING;
    `;
  }
  console.log(`Synced ${logs.length} audit logs.`);

  console.log("✓ Done syncing to neondb!");
}

sync().catch(console.error);
