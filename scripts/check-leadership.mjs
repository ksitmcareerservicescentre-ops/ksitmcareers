import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const rows = await sql`SELECT * FROM leadership_profiles ORDER BY display_order`;
  console.log("Count:", rows.length);
  console.log(JSON.stringify(rows, null, 2));
}

run().catch(console.error);
