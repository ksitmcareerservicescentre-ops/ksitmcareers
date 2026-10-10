import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL missing from .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

async function runWithRetry(fn, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt === maxRetries) throw err;
      await new Promise((res) => setTimeout(res, 2000 * attempt));
    }
  }
}

async function main() {
  console.log("Applying student master list DDL and seeding initial master records...");

  await runWithRetry(async () => {
    // 1. Create student_master_list table
    await sql.query(`
      CREATE TABLE IF NOT EXISTS student_master_list (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        reg_number text NOT NULL UNIQUE,
        first_name text NOT NULL,
        last_name text NOT NULL,
        middle_name text,
        full_name text NOT NULL,
        department text,
        level text,
        phone text,
        is_registered boolean NOT NULL DEFAULT false,
        registered_at timestamptz,
        registered_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await sql.query(`
      CREATE INDEX IF NOT EXISTS master_reg_number_idx ON student_master_list (reg_number);
    `);
    await sql.query(`
      CREATE INDEX IF NOT EXISTS master_is_registered_idx ON student_master_list (is_registered);
    `);

    // 2. Add master_record_id to student_profiles
    await sql.query(`
      ALTER TABLE student_profiles
      ADD COLUMN IF NOT EXISTS master_record_id uuid REFERENCES student_master_list(id) ON DELETE SET NULL;
    `);

    // 3. Sync any existing registered students from student_profiles into student_master_list
    const existingStudents = await sql.query(`
      SELECT sp.id, sp.user_id, sp.reg_number, sp.full_name, sp.department, sp.level, sp.phone, sp.created_at
      FROM student_profiles sp;
    `);

    console.log(`Found ${existingStudents.length} existing student profiles to synchronize.`);

    for (const st of existingStudents) {
      const parts = (st.full_name || "Student").trim().split(/\s+/);
      const firstName = parts[0] || "Student";
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
      const middleName = parts.length > 2 ? parts[1] : null;

      // Upsert into master list
      const rows = await sql.query(
        `
        INSERT INTO student_master_list (
          reg_number, first_name, last_name, middle_name, full_name,
          department, level, phone, is_registered, registered_at, registered_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10)
        ON CONFLICT (reg_number) DO UPDATE SET
          is_registered = true,
          registered_at = COALESCE(student_master_list.registered_at, EXCLUDED.registered_at),
          registered_user_id = EXCLUDED.registered_user_id
        RETURNING id;
      `,
        [
          st.reg_number.toUpperCase(),
          firstName,
          lastName,
          middleName,
          st.full_name,
          st.department,
          st.level,
          st.phone,
          st.created_at || new Date(),
          st.user_id,
        ],
      );

      if (rows && rows[0]?.id) {
        await sql.query(
          `UPDATE student_profiles SET master_record_id = $1 WHERE id = $2;`,
          [rows[0].id, st.id],
        );
      }
    }

    // 4. Seed accredited KSITM institutional student master list records
    const seedRecords = [
      {
        regNumber: "KSITM/ND/STE/24/001",
        firstName: "Amina",
        lastName: "Yusuf",
        middleName: "Bello",
        fullName: "Amina Bello Yusuf",
        department: "Computer Software Engineering",
        level: "National Diploma I (ND 1)",
        phone: "+234 802 111 2201",
      },
      {
        regNumber: "KSITM/ND/STE/24/002",
        firstName: "Ibrahim",
        lastName: "Bello",
        middleName: "Musa",
        fullName: "Ibrahim Musa Bello",
        department: "Computer Software Engineering",
        level: "National Diploma I (ND 1)",
        phone: "+234 803 222 3302",
      },
      {
        regNumber: "KSITM/ND/NSS/24/015",
        firstName: "Fatima",
        lastName: "Aliyu",
        middleName: "Gambo",
        fullName: "Fatima Gambo Aliyu",
        department: "Networking & System Security",
        level: "National Diploma I (ND 1)",
        phone: "+234 804 333 4403",
      },
      {
        regNumber: "KSITM/ND/BOP/24/008",
        firstName: "Usman",
        lastName: "Kabir",
        middleName: null,
        fullName: "Usman Kabir",
        department: "Banking Operations",
        level: "National Diploma I (ND 1)",
        phone: "+234 805 444 5504",
      },
      {
        regNumber: "KSITM/HND/CSE/23/004",
        firstName: "Zainab",
        lastName: "Sani",
        middleName: "Dikko",
        fullName: "Zainab Dikko Sani",
        department: "Computer Software Engineering",
        level: "Higher National Diploma II (HND 2)",
        phone: "+234 806 555 6605",
      },
      {
        regNumber: "KSITM/ND/MMT/24/011",
        firstName: "Abubakar",
        lastName: "Umar",
        middleName: "Faruk",
        fullName: "Abubakar Faruk Umar",
        department: "Multimedia Technology",
        level: "National Diploma I (ND 1)",
        phone: "+234 807 666 7706",
      },
      {
        regNumber: "KSITM/HND/EEE/23/019",
        firstName: "Maryam",
        lastName: "Dahiru",
        middleName: null,
        fullName: "Maryam Dahiru",
        department: "Electrical & Electronics Engineering",
        level: "Higher National Diploma I (HND 1)",
        phone: "+234 808 777 8807",
      },
      {
        regNumber: "KSITM/ND/ACC/24/022",
        firstName: "Mustapha",
        lastName: "Garba",
        middleName: "Danladi",
        fullName: "Mustapha Danladi Garba",
        department: "Accountancy & Financial Management",
        level: "National Diploma II (ND 2)",
        phone: "+234 809 888 9908",
      },
      {
        regNumber: "KSITM/ND/BES/24/030",
        firstName: "Hauwa",
        lastName: "Lawal",
        middleName: "Shehu",
        fullName: "Hauwa Shehu Lawal",
        department: "Business & Entrepreneurship Studies",
        level: "National Diploma I (ND 1)",
        phone: "+234 810 999 0009",
      },
      {
        regNumber: "KSITM/ND/LIS/24/005",
        firstName: "Suleiman",
        lastName: "Shehu",
        middleName: null,
        fullName: "Suleiman Shehu",
        department: "Library & Information Science",
        level: "National Diploma II (ND 2)",
        phone: "+234 811 000 1110",
      },
    ];

    for (const rec of seedRecords) {
      await sql.query(
        `
        INSERT INTO student_master_list (
          reg_number, first_name, last_name, middle_name, full_name,
          department, level, phone, is_registered
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
        ON CONFLICT (reg_number) DO NOTHING;
      `,
        [
          rec.regNumber.toUpperCase(),
          rec.firstName,
          rec.lastName,
          rec.middleName,
          rec.fullName,
          rec.department,
          rec.level,
          rec.phone,
        ],
      );
    }

    console.log("Master list DDL applied and seed records populated successfully!");
  });
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
