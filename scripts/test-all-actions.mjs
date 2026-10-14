import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { listAssessmentsAction, getAssessmentParticipantsAction } from "../src/actions/assessments.ts";
import { listJobPostingsAction } from "../src/actions/jobs.ts";
import { listPartnerEmployersAction } from "../src/actions/employers.ts";
import { listVirtualInternshipsAction } from "../src/actions/internships.ts";

async function main() {
  console.log("=== Testing Server Actions against neondb ===");

  try {
    const assessments = await listAssessmentsAction();
    console.log("1. listAssessmentsAction OK, count:", assessments.length);
  } catch (e) {
    console.error("1. listAssessmentsAction ERROR:", e);
  }

  try {
    const participants = await getAssessmentParticipantsAction();
    console.log("2. getAssessmentParticipantsAction OK, count:", participants.length);
  } catch (e) {
    console.error("2. getAssessmentParticipantsAction ERROR:", e);
  }

  try {
    const jobs = await listJobPostingsAction();
    console.log("3. listJobPostingsAction OK, count:", jobs.length);
  } catch (e) {
    console.error("3. listJobPostingsAction ERROR:", e);
  }

  try {
    const employers = await listPartnerEmployersAction();
    console.log("4. listPartnerEmployersAction OK, count:", employers.length);
  } catch (e) {
    console.error("4. listPartnerEmployersAction ERROR:", e);
  }

  try {
    const internships = await listVirtualInternshipsAction();
    console.log("5. listVirtualInternshipsAction OK, count:", internships.length);
  } catch (e) {
    console.error("5. listVirtualInternshipsAction ERROR:", e);
  }
}

main().catch(console.error);
