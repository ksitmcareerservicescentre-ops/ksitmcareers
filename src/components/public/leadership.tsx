import { LeadershipCard } from "./leadership-card";

type PublishedLeader = { id: string; name: string; position: string; imageUrl: string; summary: string; biography: unknown };

export function Leadership({ profiles }: { profiles?: PublishedLeader[] }) {
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
          {profiles && profiles.length > 0 ? profiles.map((profile) => <LeadershipCard key={profile.id} id={profile.id} name={profile.name} position={profile.position} image={profile.imageUrl} summary={profile.summary} details={<>{(Array.isArray(profile.biography) ? profile.biography : [profile.biography]).filter(Boolean).map((paragraph, index) => <p key={index}>{String(paragraph)}</p>)}</>} />) : <>
          <LeadershipCard
            id="nura-sadiq"
            name="Nura Sadiq, M.Sc., CPCC"
            position="Career Center Coordinator & Contact Person"
            image="https://res.cloudinary.com/djkudkxmx/image/upload/v1790675993/Gemini_Generated_Image_pndmuepndmuepndm_vjfsu2.jpg"
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
