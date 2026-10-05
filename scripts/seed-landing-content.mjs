import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

const gallery = [
  ["Learning together", "Scenes from the shared learning experience at KSITM.", "https://res.cloudinary.com/djkudkxmx/image/upload/v1790510808/12_gejlfg.jpg"],
  ["Community in focus", "A snapshot of connection and activity around the institute.", "https://res.cloudinary.com/djkudkxmx/image/upload/v1790510807/19_ogvqvj.jpg"],
  ["Another perspective", "Explore another scene from the KSITM gallery.", "https://res.cloudinary.com/djkudkxmx/image/upload/v1790510808/17_yg0hpl.jpg"],
  ["Shared experiences", "A further glimpse into the KSITM community.", "https://res.cloudinary.com/djkudkxmx/image/upload/v1790510808/13_xlkzft.jpg"],
  ["Shared experiences", "A further glimpse into the KSITM community.", "https://res.cloudinary.com/djkudkxmx/image/upload/v1790675969/Gemini_Generated_Image_wd6fouwd6fouwd6f_unakt3.jpg"],
  ["Shared experiences", "A further glimpse into the KSITM community.", "https://res.cloudinary.com/djkudkxmx/image/upload/v1790675990/Gemini_Generated_Image_8q8pmc8q8pmc8q8p_dsqkay.jpg"],
  ["Shared experiences", "A further glimpse into the KSITM community.", "https://res.cloudinary.com/djkudkxmx/image/upload/v1790675990/Gemini_Generated_Image_9560vq9560vq9560_avlrqc.jpg"],
  ["Shared experiences", "A further glimpse into the KSITM community.", "https://res.cloudinary.com/djkudkxmx/image/upload/v1790703234/ChatGPT_Image_Sep_29_2026_06_33_23_PM_diyx8d.png"],
];
const leaders = [
  ["Nura Sadiq, M.Sc., CPCC", "Career Center Coordinator & Contact Person", "Lecturer II and Coordinator of the Career Services Centre at KSITM, with over a decade of experience in teaching, academic administration and career development.", "https://res.cloudinary.com/djkudkxmx/image/upload/v1790675993/Gemini_Generated_Image_pndmuepndmuepndm_vjfsu2.jpg", ["He specialises in career coaching, employability development, entrepreneurship, industry engagement, mentorship and student-to-work transition.", "He holds an M.Sc. and B.Sc. in Accounting and an ND in Accounting, and is a Certified Professional Career Coach (CPCC) and Member Professional Mentor and Coach (Mpmc).", "His professional experience includes leadership and coordination roles in career services, employability and entrepreneurship, skills development and community service at KSITM.", "Nura is passionate about connecting education with the world of work and helping students develop the skills, confidence, professional identity and networks required to thrive in an evolving labour market. His interests also include accounting, financial reporting, corporate governance, financial resilience, career development and the application of emerging technologies to professional practice."]],
  ["Abubakar Abdu", "Assistant Coordinator, Career Coaching", "A seasoned accounting professional with expertise in banking, auditing, financial services and corporate reporting.", "https://res.cloudinary.com/djkudkxmx/image/upload/v1790675981/Gemini_Generated_Image_ew9rw7ew9rw7ew9r_qctlmm.jpg", ["A member of ICAN, CIMCN, CIIF, and NIIE, he is passionate about entrepreneurship, mentoring, coaching, and developing future leaders.", "As an Assistant Coordinator, he supports students and alumni by providing career guidance, organizing professional development programs, and managing daily Career Center operations."]],
];
const updates = [
  ["Career opportunities", "Keep an eye on this space for upcoming career events and opportunities.", "Keep an eye on this space for upcoming career events and opportunities."],
  ["Campus announcements", "News and dates will appear here as they are confirmed.", "News and dates will appear here as they are confirmed."],
];

for (let i = 0; i < gallery.length; i += 1) {
  const [title, caption, imageUrl] = gallery[i];
  const existing = await sql`select id from gallery_items where image_url = ${imageUrl} limit 1`;
  if (!existing.length) await sql`insert into gallery_items (title, caption, image_url, image_alt, display_order, is_published) values (${title}, ${caption}, ${imageUrl}, ${`KSITM gallery photo: ${title}`}, ${i}, true)`;
}
for (let i = 0; i < leaders.length; i += 1) {
  const [name, position, summary, imageUrl, biography] = leaders[i];
  const existing = await sql`select id from leadership_profiles where name = ${name} limit 1`;
  if (!existing.length) await sql`insert into leadership_profiles (name, position, image_url, image_alt, summary, biography, display_order, is_published) values (${name}, ${position}, ${imageUrl}, ${name}, ${summary}, ${JSON.stringify(biography)}::jsonb, ${i}, true)`;
}
for (const [title, summary, content] of updates) {
  const existing = await sql`select id from announcements where title = ${title} limit 1`;
  if (!existing.length) await sql`insert into announcements (title, summary, content, is_published, published_at) values (${title}, ${summary}, ${content}, true, now())`;
}
console.log(`Landing content ready: ${gallery.length} gallery items, ${leaders.length} leadership profiles, ${updates.length} updates.`);
