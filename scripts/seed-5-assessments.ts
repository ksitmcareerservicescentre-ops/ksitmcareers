import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { fiveSeedAssessments } from "../src/lib/assessments-seed-data";

const dbUrlKsitm = process.env.DATABASE_URL;
if (!dbUrlKsitm) {
  console.error("DATABASE_URL is not defined in .env.local");
  process.exit(1);
}

const dbUrlNeon = dbUrlKsitm.includes("/ksitmcareers")
  ? dbUrlKsitm.replace("/ksitmcareers", "/neondb")
  : null;

const targets = [
  { name: "ksitmcareers", url: dbUrlKsitm },
  ...(dbUrlNeon ? [{ name: "neondb", url: dbUrlNeon }] : []),
];

async function seed() {
  for (const { name, url } of targets) {
    console.log(`\n========================================`);
    console.log(`Seeding 5 Job Readiness Assessments to ${name}...`);
    console.log(`========================================`);

    const sql = neon(url);

    for (const item of fiveSeedAssessments) {
      console.log(`\nProcessing: "${item.title}" (${item.questions.length} questions)...`);

      // Delete existing assessment with same slug to ensure fresh clean state
      const existing = await sql`
        SELECT id FROM assessments WHERE slug = ${item.slug} LIMIT 1;
      `;

      let assessmentId: string;
      if (existing.length > 0) {
        assessmentId = existing[0].id;
        console.log(`Updating existing assessment (ID: ${assessmentId})...`);
        await sql`
          UPDATE assessments
          SET title = ${item.title},
              description = ${item.description},
              category = ${item.category},
              time_limit_minutes = ${item.timeLimitMinutes},
              passing_score = ${item.passingScore},
              is_active = ${item.isActive},
              updated_at = NOW()
          WHERE id = ${assessmentId}::uuid;
        `;
        // Clear existing questions for clean re-insertion
        await sql`DELETE FROM assessment_questions WHERE assessment_id = ${assessmentId}::uuid;`;
      } else {
        console.log(`Creating new assessment...`);
        const inserted = await sql`
          INSERT INTO assessments (
            title, slug, description, category, time_limit_minutes, passing_score, is_active, created_at, updated_at
          ) VALUES (
            ${item.title}, ${item.slug}, ${item.description}, ${item.category},
            ${item.timeLimitMinutes}, ${item.passingScore}, ${item.isActive}, NOW(), NOW()
          ) RETURNING id;
        `;
        assessmentId = inserted[0].id;
      }

      // Insert all 20 questions
      for (const q of item.questions) {
        await sql`
          INSERT INTO assessment_questions (
            assessment_id, question_text, question_type, options, display_order
          ) VALUES (
            ${assessmentId}::uuid,
            ${q.questionText},
            ${q.questionType},
            ${JSON.stringify(q.options)}::jsonb,
            ${q.displayOrder}
          );
        `;
      }

      console.log(`✓ Inserted 20 questions for "${item.title}".`);
    }

    const counts = await sql`
      SELECT a.title, count(q.id) as question_count
      FROM assessments a
      LEFT JOIN assessment_questions q ON q.assessment_id = a.id
      GROUP BY a.id, a.title
      ORDER BY a.created_at;
    `;
    console.log(`\nDatabase "${name}" Assessments status:`);
    console.table(counts);
  }

  console.log("\nAll 5 assessments seeded successfully with 20 questions each!");
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
