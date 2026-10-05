import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const dbUrlKsitm = process.env.DATABASE_URL;
const dbUrlNeon = dbUrlKsitm.replace("/ksitmcareers", "/neondb");

console.log("=== Checking ksitmcareers database ===");
try {
  const sqlKsitm = neon(dbUrlKsitm);
  const tablesKsitm = await sqlKsitm`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log(`ksitmcareers table count: ${tablesKsitm.length}`);
  const usersCount = await sqlKsitm`SELECT count(*) FROM users;`;
  const servicesCount = await sqlKsitm`SELECT count(*) FROM career_services;`;
  console.log(` - users: ${usersCount[0].count}`);
  console.log(` - career_services: ${servicesCount[0].count}`);
} catch (err) {
  console.error("Error connecting to ksitmcareers:", err.message);
}

console.log("\n=== Checking neondb database ===");
try {
  const sqlNeon = neon(dbUrlNeon);
  const tablesNeon = await sqlNeon`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log(`neondb table count: ${tablesNeon.length}`);
  const usersCount = await sqlNeon`SELECT count(*) FROM users;`;
  const servicesCount = await sqlNeon`SELECT count(*) FROM career_services;`;
  console.log(` - users: ${usersCount[0].count}`);
  console.log(` - career_services: ${servicesCount[0].count}`);
} catch (err) {
  console.error("Error connecting to neondb:", err.message);
}
