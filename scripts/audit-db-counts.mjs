import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;

  const counts = {};
  for (const t of tables) {
    const tableName = t.table_name;
    const res = await sql.query(`SELECT count(*)::int as count FROM "${tableName}"`);
    counts[tableName] = res[0].count;
  }

  console.log(JSON.stringify(counts, null, 2));
}

main().catch(console.error);
