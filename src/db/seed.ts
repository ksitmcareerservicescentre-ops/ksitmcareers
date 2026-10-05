import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const initialServices = [
  {
    slug: "consultations",
    title: "Appointment Scheduler",
    summary:
      "Make room for your next step. Talk through your goals with a Career Assistant.",
    description:
      "The student portal supports consultation requests, confirmed appointment details and appointment history.",
    icon: "calendar",
    displayOrder: 1,
    isActive: true,
  },
  {
    slug: "mentorship",
    title: "Mentorship",
    summary:
      "Find perspective, encouragement and guidance for the journey ahead.",
    description:
      "Mentorship connects students with verified mentors and relevant specialisations based on individual career plans.",
    icon: "people",
    displayOrder: 2,
    isActive: true,
  },
  {
    slug: "resume",
    title: "Resume Builder",
    summary:
      "Bring your education, experience and strengths together in a professional resume.",
    description:
      "Structured resume builder supporting education, experience, skills, projects, and certifications with PDF/print rendering.",
    icon: "document",
    displayOrder: 3,
    isActive: true,
  },
  {
    slug: "training",
    title: "Employability Skills Training",
    summary:
      "Develop communication, leadership and practical workplace skills.",
    description:
      "High-impact employability learning videos with progress tracking, curated by Career Assistants.",
    icon: "play",
    displayOrder: 4,
    isActive: true,
  },
  {
    slug: "internships",
    title: "Virtual Internship",
    summary:
      "Explore opportunities to put your learning into practice beyond the classroom.",
    description:
      "Verified internship opportunities including requirements, deadlines, and guided application methods.",
    icon: "laptop",
    displayOrder: 5,
    isActive: true,
  },
  {
    slug: "employers",
    title: "Employer Engagement",
    summary:
      "Connect your ambitions with the world of work and professional opportunities.",
    description:
      "Direct bridge to partner organizations, industry roundtables, employer showcases, and career fairs.",
    icon: "briefcase",
    displayOrder: 6,
    isActive: true,
  },
  {
    slug: "readiness",
    title: "Job Readiness Assessment",
    summary:
      "Reflect on your strengths and identify the skills to develop next.",
    description:
      "Data-driven assessments evaluating resume readiness, communication, and professional workplace preparedness.",
    icon: "check",
    displayOrder: 7,
    isActive: true,
  },
];

async function seed() {
  console.log("Seeding institutional Career Services catalog...");

  for (const s of initialServices) {
    await db
      .insert(schema.careerServices)
      .values(s)
      .onConflictDoUpdate({
        target: schema.careerServices.slug,
        set: {
          title: s.title,
          summary: s.summary,
          description: s.description,
          icon: s.icon,
          displayOrder: s.displayOrder,
          isActive: s.isActive,
        },
      });
  }

  console.log("✓ Career Services catalog seeded successfully.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
