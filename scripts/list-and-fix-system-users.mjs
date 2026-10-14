import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function listAll() {
  const allUsers = await sql`SELECT id, email, role, is_active FROM users ORDER BY role, email`;
  console.log("Total users:", allUsers.length);
  for (const u of allUsers) {
    console.log(`[${u.role}] ${u.email} (ID: ${u.id}, Active: ${u.is_active})`);
  }
}
listAll().catch(console.error);
