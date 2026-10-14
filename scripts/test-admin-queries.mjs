import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Testing admin queries against DATABASE_URL:", process.env.DATABASE_URL);

  try {
    const officers = await sql.query(`
      SELECT sp.id, sp.user_id, sp.full_name, sp.staff_code, sp.designation, sp.can_manage_appointments, sp.can_manage_services, sp.created_at, u.email, u.is_active
      FROM staff_profiles sp
      INNER JOIN users u ON sp.user_id = u.id
      ORDER BY sp.created_at DESC
    `);
    console.log("1. officers query OK, count:", officers.length);
  } catch (e) {
    console.error("1. officers query ERROR:", e);
  }

  try {
    const students = await sql.query(`
      SELECT sp.id, sp.full_name, sp.reg_number, sp.department, sp.level, u.email, u.is_active, sp.avatar_url, sp.created_at
      FROM student_profiles sp
      INNER JOIN users u ON sp.user_id = u.id
      ORDER BY sp.created_at DESC
      LIMIT 10
    `);
    console.log("2. students query OK, count:", students.length);
  } catch (e) {
    console.error("2. students query ERROR:", e);
  }

  try {
    const logs = await sql.query(`
      SELECT id, action, entity_type, created_at
      FROM audit_logs
      WHERE action != 'USER_LOGIN' AND (action LIKE 'MODULE_%' OR entity_type IN ('learning_modules', 'module_assignments'))
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log("3. logs query OK, count:", logs.length);
  } catch (e) {
    console.error("3. logs query ERROR:", e);
  }

  try {
    const appts = await sql.query(`
      SELECT a.id, sp.full_name AS student_name, a.status, a.scheduled_start, stp.full_name AS staff_name
      FROM appointments a
      INNER JOIN student_profiles sp ON a.student_id = sp.id
      LEFT JOIN staff_profiles stp ON a.staff_id = stp.id
      ORDER BY a.scheduled_start DESC
      LIMIT 50
    `);
    console.log("4. appointments query OK, count:", appts.length);
  } catch (e) {
    console.error("4. appointments query ERROR:", e);
  }

  try {
    const gallery = await sql.query(`SELECT * FROM gallery_items ORDER BY display_order, created_at DESC`);
    console.log("5. gallery query OK, count:", gallery.length);
  } catch (e) {
    console.error("5. gallery query ERROR:", e);
  }

  try {
    const training = await sql.query(`
      SELECT tv.id, tv.title, tv.description, tv.video_url, tv.video_id, tv.video_provider, tv.thumbnail_url, tv.instructor, tv.is_published, tc.name AS category_name
      FROM training_videos tv
      INNER JOIN training_categories tc ON tv.category_id = tc.id
      ORDER BY tv.display_order, tv.created_at DESC
    `);
    console.log("6. training query OK, count:", training.length);
  } catch (e) {
    console.error("6. training query ERROR:", e);
  }

  try {
    const leaders = await sql.query(`SELECT * FROM leadership_profiles ORDER BY display_order, created_at DESC`);
    console.log("7. leadership query OK, count:", leaders.length);
  } catch (e) {
    console.error("7. leadership query ERROR:", e);
  }

  try {
    const ann = await sql.query(`SELECT * FROM announcements ORDER BY created_at DESC`);
    console.log("8. announcements query OK, count:", ann.length);
  } catch (e) {
    console.error("8. announcements query ERROR:", e);
  }
}

main().catch(console.error);
