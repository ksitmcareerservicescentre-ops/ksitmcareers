import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const userDbUrl = "postgresql://neondb_owner:npg_fYL5dnDXwaE4@ep-restless-grass-b2wbgjl5-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const currentAppDbUrl = process.env.DATABASE_URL;

const sqlNeon = neon(userDbUrl);
const sqlApp = neon(currentAppDbUrl);

async function main() {
  console.log("Current App DB URL:", currentAppDbUrl);
  console.log("User Target DB URL:", userDbUrl);

  const neonTables = await sqlNeon.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log("\n=== NEONDB table counts ===");
  for (const t of neonTables) {
    try {
      const res = await sqlNeon.query(`SELECT count(*)::int as count FROM "${t.table_name}"`);
      console.log(`${t.table_name}: ${res[0].count}`);
    } catch (e) {
      console.log(`${t.table_name}: ERROR ${e.message}`);
    }
  }
}

main().catch(console.error);
