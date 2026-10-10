import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const a = await sql`SELECT count(*) FROM assessments;`;
const q = await sql`SELECT count(*) FROM assessment_questions;`;
const att = await sql`SELECT count(*) FROM assessment_attempts;`;
console.log({ assessments: a[0].count, questions: q[0].count, attempts: att[0].count });
