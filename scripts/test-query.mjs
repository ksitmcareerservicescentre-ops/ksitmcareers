import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
try {
  const result = await sql`SELECT 1 as test`;
  console.log("Neon query succeeded:", result);
} catch (err) {
  console.error("Neon query failed:", err);
}
