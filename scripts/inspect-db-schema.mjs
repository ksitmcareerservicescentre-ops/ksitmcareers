import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

async function main() {
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  console.log("Current Tables:", res.rows.map(r => r.table_name));
  
  // Check social_links
  const socialRes = await pool.query("SELECT * FROM social_links;").catch(() => ({ rows: [] }));
  console.log("Social links count:", socialRes.rows.length);

  // Check testimonials
  const testRes = await pool.query("SELECT * FROM testimonials;").catch(() => ({ rows: [] }));
  console.log("Testimonials count:", testRes.rows.length);

  // Check career_services
  const svcRes = await pool.query("SELECT id, slug, title, is_active FROM career_services;").catch(() => ({ rows: [] }));
  console.log("Career Services:", svcRes.rows);

  await pool.end();
}

main().catch(console.error);
