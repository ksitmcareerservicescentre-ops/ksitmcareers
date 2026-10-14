import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const sql = neon(process.env.DATABASE_URL);

async function verifyPassword(password, hash) {
  try {
    const [salt, key] = hash.replace("scrypt:", "").split(":");
    if (!salt || !key) return false;
    const derivedKey = await scryptAsync(password, salt, 64);
    return timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
  } catch {
    return false;
  }
}

async function testPasswords() {
  const users = await sql`
    SELECT id, email, role, password_hash 
    FROM users 
    WHERE email LIKE '%admin%' 
       OR email LIKE '%student%' 
       OR email LIKE '%officer%' 
       OR email LIKE '%employer%'
       OR email LIKE '%assistant%'
    ORDER BY role, email
  `;
  console.log("Testing password '12345678' against system users:");
  for (const u of users) {
    const is12345678 = await verifyPassword("12345678", u.password_hash);
    console.log(`  - [${u.role}] ${u.email}: 12345678 -> ${is12345678 ? 'VALID' : 'INVALID'}`);
  }
}

testPasswords().catch(console.error);
