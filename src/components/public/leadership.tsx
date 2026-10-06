import { LeadershipCard } from "./leadership-card";

type PublishedLeader = { id: string; name: string; position: string; imageUrl: string; summary: string; biography: unknown };

export function Leadership({ profiles }: { profiles?: PublishedLeader[] }) {
  const leadershipOrder = (name: string) => {
    const value = name.toLowerCase();
    if (value.includes("musa ahmed zayyad")) return 1;
    if (value.includes("nura sadiq")) return 2;
    if (value.includes("abubakar abdu")) return 3;
    if (value.includes("bashir sirajo")) return 4;
    return 5;
  };
  return (
    <section id="leaders" className="py-24 bg-[#0A0A1A] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[#FF7F24] font-bold uppercase tracking-[.2em] text-sm mb-3">
            Leadership
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5">
            Guidance for the next generation
          </h2>
          <p className="text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Meet the Career Center leadership helping KSITM students connect
            learning with practical opportunities and prepare for what comes
            next.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {profiles && profiles.length > 0 ? <>{profiles.map((profile) => <LeadershipCard key={profile.id} id={profile.id} name={profile.name} position={profile.position} image={profile.imageUrl} summary={profile.summary} order={leadershipOrder(profile.name)} details={<>{(Array.isArray(profile.biography) ? profile.biography : [profile.biography]).filter(Boolean).map((paragraph, index) => <p key={index}>{String(paragraph)}</p>)}</>} />)}<AdditionalLeaders profiles={profiles} /></> : <>
          <LeadershipCard
            id="nura-sadiq"
            name="Nura Sadiq, M.Sc., CPCC"
            position="Career Center Coordinator & Contact Person"
            image="https://res.cloudinary.com/djkudkxmx/image/upload/v1790675993/Gemini_Generated_Image_pndmuepndmuepndm_vjfsu2.jpg"
            order={2}
            summary="Lecturer II and Coordinator of the Career Services Centre at KSITM, with over a decade of experience in teaching, academic administration and career development."
            details={
              <>
                <p>
                  He specialises in career coaching, employability development,
                  entrepreneurship, industry engagement, mentorship and
                  student-to-work transition.
                </p>
                <p>
                  He holds an M.Sc. and B.Sc. in Accounting and an ND in
                  Accounting, and is a Certified Professional Career Coach
                  (CPCC) and Member Professional Mentor and Coach (Mpmc).
                </p>
                <p>
                  His professional experience includes leadership and
                  coordination roles in career services, employability and
                  entrepreneurship, skills development and community service at
                  KSITM.
                </p>
                <p>
                  Nura is passionate about connecting education with the world
                  of work and helping students develop the skills, confidence,
                  professional identity and networks required to thrive in an
                  evolving labour market. His interests also include accounting,
                  financial reporting, corporate governance, financial
                  resilience, career development and the application of emerging
                  technologies to professional practice.
                </p>
                <p className="text-white font-semibold">
                  <span className="text-[#FF7F24]">Guiding philosophy:</span>{" "}
                  Discover. Develop. Connect. Transition. Progress.
                </p>
              </>
            }
          />

          <LeadershipCard
            id="abubakar-abdu"
            name="Abubakar Abdu"
            position="Assistant Coordinator, Career Coaching"
            image="https://res.cloudinary.com/djkudkxmx/image/upload/v1790675981/Gemini_Generated_Image_ew9rw7ew9rw7ew9r_qctlmm.jpg"
            order={3}
            summary="A seasoned accounting professional with expertise in banking, auditing, financial services and corporate reporting."
            details={
              <>
                <p>
                  A member of ICAN, CIMCN, CIIF, and NIIE, he is passionate
                  about entrepreneurship, mentoring, coaching, and developing
                  future leaders.
                </p>
                <p>
                  As an Assistant Coordinator, he supports students and alumni
                  by providing career guidance, organizing professional
                  development programs, and managing daily Career Center
                  operations.
                </p>
              </>
            }
          />
          <AdditionalLeaders />
          </>}
        </div>

        <div className="text-center">
          <a
            href="#contacts"
            className="inline-block mt-9 text-[#FF7F24] font-bold hover:underline"
          >
            Connect with the team →
          </a>
        </div>
      </div>
    </section>
  );
}

function AdditionalLeaders({ profiles = [] }: { profiles?: PublishedLeader[] }) {
  const has = (name: string) => profiles.some((profile) => profile.name.toLowerCase().includes(name));
  return <>
    {!has("bashir sirajo") && <LeadershipCard
      id="bashir-sirajo"
      name="Bashir Sirajo"
      position="Assistant Coordinator, Industry/Employer Relations"
      image="https://res.cloudinary.com/njlhwruu/image/upload/v1791258916/Gemini_Generated_Image_2sw3ye2sw3ye2sw3.jpg"
      order={4}
      summary="Academic administrator and professional mentor supporting student development, employer relations and institutional career services."
      details={<>
        <p>Bashir Sirajo was born on 2 September 1987 in Danmusa Town, Danmusa Local Government Area of Katsina State. He is an experienced academic administrator and currently serves as Academic Secretary/Senior Assistant Registrar at the Katsina State Institute of Technology and Management (KSITM).</p>
        <p>He holds a Master of Public Administration (MPA) and has developed professional expertise in academic administration, student affairs, mentoring, coaching, and institutional development. He is a professional member of MCAI, MPMC, and CPCC, reflecting his commitment to continuous professional development.</p>
        <p>As a Professional Mentor and Coach, Bashir has demonstrated a strong interest in guiding students and young professionals toward personal, academic, and career development. He has also contributed to institutional programmes through presentations and capacity-building activities.</p>
        <p>Between 2018, 2025, and 2026, he presented papers on general ethics, conduct, rules, and regulations of the Institute during students’ orientation programmes. He has also presented a paper at an International Conference at the University of Douala, Cameroon, and delivered a presentation during a step-down workshop on Career Services, among other professional engagements.</p>
        <p>In recognition of his dedication and contributions to the Institute, Bashir has received commendations and appreciations from the Management. His professional interests include academic administration, mentoring and coaching, student development, career services, ethics, and institutional management.</p>
      </>}
    />}
    {!has("musa ahmed zayyad") && <LeadershipCard
      id="musa-ahmed-zayyad"
      name="Dr. Musa Ahmed Zayyad, MCPN, MNCS"
      position="Rector, KSITM"
      image="https://res.cloudinary.com/djkudkxmx/image/upload/v1790703042/Gemini_Generated_Image_wd6fouwd6fouwd6f_unakt3.jpg"
      order={1}
      summary="Rector of the Katsina State Institute of Technology and Management."
      details={<p>Biography information will be published here when officially supplied by the Institute.</p>}
    />}
  </>;
}
