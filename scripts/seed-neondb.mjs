import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const dbUrlNeon = process.env.DATABASE_URL.replace("/ksitmcareers", "/neondb");
const sql = neon(dbUrlNeon);

const initialServices = [
  {
    slug: "consultations",
    title: "Appointment Scheduler",
    summary:
      "Make room for your next step. Talk through your goals with a Career Assistant.",
    description:
      "The student portal supports consultation requests, confirmed appointment details and appointment history.",
    icon: "calendar",
    display_order: 1,
    is_active: true,
  },
  {
    slug: "mentorship",
    title: "Mentorship",
    summary:
      "Find perspective, encouragement and guidance for the journey ahead.",
    description:
      "Mentorship connects students with verified mentors and relevant specialisations based on individual career plans.",
    icon: "people",
    display_order: 2,
    is_active: true,
  },
  {
    slug: "resume",
    title: "Resume Builder",
    summary:
      "Bring your education, experience and strengths together in a professional resume.",
    description:
      "Structured resume builder supporting education, experience, skills, projects, and certifications with PDF/print rendering.",
    icon: "document",
    display_order: 3,
    is_active: true,
  },
  {
    slug: "training",
    title: "Employability Skills Training",
    summary:
      "Develop communication, leadership and practical workplace skills.",
    description:
      "High-impact employability learning videos with progress tracking, curated by Career Assistants.",
    icon: "play",
    display_order: 4,
    is_active: true,
  },
  {
    slug: "internships",
    title: "Virtual Internship",
    summary:
      "Explore opportunities to put your learning into practice beyond the classroom.",
    description:
      "Verified internship opportunities including requirements, deadlines, and guided application methods.",
    icon: "laptop",
    display_order: 5,
    is_active: true,
  },
  {
    slug: "employers",
    title: "Employer Engagement",
    summary:
      "Connect your ambitions with the world of work and professional opportunities.",
    description:
      "Direct bridge to partner organizations, industry roundtables, employer showcases, and career fairs.",
    icon: "briefcase",
    display_order: 6,
    is_active: true,
  },
  {
    slug: "readiness",
    title: "Job Readiness Assessment",
    summary:
      "Reflect on your strengths and identify the skills to develop next.",
    description:
      "Data-driven assessments evaluating resume readiness, communication, and professional workplace preparedness.",
    icon: "check",
    display_order: 7,
    is_active: true,
  },
];

console.log("Seeding career_services in neondb...");
for (const s of initialServices) {
  await sql`
    INSERT INTO career_services (slug, title, summary, description, icon, display_order, is_active)
    VALUES (${s.slug}, ${s.title}, ${s.summary}, ${s.description}, ${s.icon}, ${s.display_order}, ${s.is_active})
    ON CONFLICT (slug) DO UPDATE
    SET title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        display_order = EXCLUDED.display_order,
        is_active = EXCLUDED.is_active;
  `;
}
console.log("✓ career_services seeded in neondb!");
