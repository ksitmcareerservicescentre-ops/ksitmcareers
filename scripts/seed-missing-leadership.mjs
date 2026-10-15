import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function seedLeadership() {
  console.log("Checking and seeding missing leadership profiles in Neon DB...");

  // Update existing Nura Sadiq to display_order 2
  await sql`
    UPDATE leadership_profiles 
    SET display_order = 2 
    WHERE LOWER(name) LIKE '%nura sadiq%'
  `;

  // Update existing Abubakar Abdu to display_order 3
  await sql`
    UPDATE leadership_profiles 
    SET display_order = 3 
    WHERE LOWER(name) LIKE '%abubakar abdu%'
  `;

  // Check if Dr. Musa Ahmed Zayyad exists
  const rectorCheck = await sql`
    SELECT id FROM leadership_profiles WHERE LOWER(name) LIKE '%musa ahmed zayyad%'
  `;
  if (rectorCheck.length === 0) {
    console.log("Inserting Dr. Musa Ahmed Zayyad...");
    await sql`
      INSERT INTO leadership_profiles (
        name,
        position,
        image_url,
        image_alt,
        summary,
        biography,
        display_order,
        is_published
      ) VALUES (
        'Dr. Musa Ahmed Zayyad, MCPN, MNCS',
        'Rector, KSITM',
        'https://res.cloudinary.com/djkudkxmx/image/upload/v1790703042/Gemini_Generated_Image_wd6fouwd6fouwd6f_unakt3.jpg',
        'Dr. Musa Ahmed Zayyad, MCPN, MNCS',
        'Rector of the Katsina State Institute of Technology and Management.',
        ${JSON.stringify(["Biography information will be published here when officially supplied by the Institute."])}::jsonb,
        1,
        true
      )
    `;
  }

  // Check if Bashir Sirajo exists
  const bashirCheck = await sql`
    SELECT id FROM leadership_profiles WHERE LOWER(name) LIKE '%bashir sirajo%'
  `;
  if (bashirCheck.length === 0) {
    console.log("Inserting Bashir Sirajo...");
    const bashirBio = [
      "Bashir Sirajo was born on 2 September 1987 in Danmusa Town, Danmusa Local Government Area of Katsina State. He is an experienced academic administrator and currently serves as Academic Secretary/Senior Assistant Registrar at the Katsina State Institute of Technology and Management (KSITM).",
      "He holds a Master of Public Administration (MPA) and has developed professional expertise in academic administration, student affairs, mentoring, coaching, and institutional development. He is a professional member of MCAI, MPMC, and CPCC, reflecting his commitment to continuous professional development.",
      "As a Professional Mentor and Coach, Bashir has demonstrated a strong interest in guiding students and young professionals toward personal, academic, and career development. He has also contributed to institutional programmes through presentations and capacity-building activities.",
      "Between 2018, 2025, and 2026, he presented papers on general ethics, conduct, rules, and regulations of the Institute during students’ orientation programmes. He has also presented a paper at an International Conference at the University of Douala, Cameroon, and delivered a presentation during a step-down workshop on Career Services, among other professional engagements.",
      "In recognition of his dedication and contributions to the Institute, Bashir has received commendations and appreciations from the Management. His professional interests include academic administration, mentoring and coaching, student development, career services, ethics, and institutional management."
    ];

    await sql`
      INSERT INTO leadership_profiles (
        name,
        position,
        image_url,
        image_alt,
        summary,
        biography,
        display_order,
        is_published
      ) VALUES (
        'Bashir Sirajo',
        'Assistant Coordinator, Industry/Employer Relations',
        'https://res.cloudinary.com/njlhwruu/image/upload/v1791258916/Gemini_Generated_Image_2sw3ye2sw3ye2sw3.jpg',
        'Bashir Sirajo',
        'Academic administrator and professional mentor supporting student development, employer relations and institutional career services.',
        ${JSON.stringify(bashirBio)}::jsonb,
        4,
        true
      )
    `;
  }

  const finalRows = await sql`
    SELECT id, name, position, display_order, is_published, image_url 
    FROM leadership_profiles 
    ORDER BY display_order ASC
  `;
  console.log(`\nFinal leadership_profiles count in Neon DB: ${finalRows.length}`);
  finalRows.forEach((r, idx) => {
    console.log(`${idx + 1}. [Order ${r.display_order}] ${r.name} - ${r.position} (Published: ${r.is_published})`);
  });
}

seedLeadership().catch(console.error);
