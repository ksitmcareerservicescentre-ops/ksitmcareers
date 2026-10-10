import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const cons = await sql`
  SELECT conname, pg_get_constraintdef(c.oid) 
  FROM pg_constraint c 
  WHERE conrelid = 'assessment_questions'::regclass;
`;
console.log("Constraints on assessment_questions:", cons);
