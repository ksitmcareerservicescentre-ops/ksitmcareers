import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const dbUrlNeon = process.env.DATABASE_URL.replace("/ksitmcareers", "/neondb");

console.log("Migrating neondb...");
const sql = neon(dbUrlNeon);
const db = drizzle(sql);

try {
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("✓ Successfully migrated neondb!");
} catch (err) {
  console.error("Migration error on neondb:", err);
}
