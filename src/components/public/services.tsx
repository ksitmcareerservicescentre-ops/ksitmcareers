import Link from "next/link";

export function Services() {
  return (
    <section id="services" className="py-24 bg-[#0A0A1A] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A1A] via-[#0A0A1A] to-[#0A0A1A]/50 pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Career{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7F24] to-[#40297B]">
              Services
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to launch your career — powered by AI and
            designed for success.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Appointment Scheduler */}
          <div className="service-card group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-[#FF7F24]/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#FF7F24]/10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FF7F24]/0 via-[#40297B]/0 to-[#FF7F24]/0 group-hover:from-[#FF7F24]/5 group-hover:via-[#40297B]/5 group-hover:to-[#FF7F24]/5 transition-all duration-500"></div>

            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-[#FF7F24]/10 flex items-center justify-center text-3xl text-[#FF7F24] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <i className="fas fa-calendar-check"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Appointment Scheduler
              </h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Book one-on-one sessions with career advisors, mentors, and
                industry professionals.
              </p>
              <Link
                href="/services/consultations"
                className="inline-flex items-center gap-2 text-[#FF7F24] font-semibold group-hover:gap-3 transition-all"
              >
                Book Now{" "}
                <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
              </Link>
            </div>
          </div>

          {/* 2. Resume Builder */}
          <div className="service-card group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-[#40297B]/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#40297B]/10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FF7F24]/0 via-[#40297B]/0 to-[#FF7F24]/0 group-hover:from-[#FF7F24]/5 group-hover:via-[#40297B]/5 group-hover:to-[#FF7F24]/5 transition-all duration-500"></div>

            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-[#40297B]/10 flex items-center justify-center text-3xl text-[#40297B] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <i className="fas fa-file-alt"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Resume Builder
              </h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Create professional, ATS-friendly resumes with AI-powered
                suggestions and templates.
              </p>
              <Link
                href="/services/resume"
                className="inline-flex items-center gap-2 text-[#40297B] font-semibold group-hover:gap-3 transition-all"
              >
                Build Resume{" "}
                <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
              </Link>
            </div>
          </div>

          {/* 3. Skills Training Videos */}
          <div className="service-card group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-[#FF7F24]/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#FF7F24]/10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FF7F24]/0 via-[#40297B]/0 to-[#FF7F24]/0 group-hover:from-[#FF7F24]/5 group-hover:via-[#40297B]/5 group-hover:to-[#FF7F24]/5 transition-all duration-500"></div>

            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-[#FF7F24]/10 flex items-center justify-center text-3xl text-[#FF7F24] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <i className="fas fa-video"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Skills Training Videos
              </h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Access curated video courses on communication, leadership, and
                employability skills.
              </p>
              <Link
                href="/services/training"
                className="inline-flex items-center gap-2 text-[#FF7F24] font-semibold group-hover:gap-3 transition-all"
              >
                Watch Videos{" "}
                <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
              </Link>
            </div>
          </div>

          {/* 4. Virtual Internship */}
          <div className="service-card group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-[#40297B]/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#40297B]/10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FF7F24]/0 via-[#40297B]/0 to-[#FF7F24]/0 group-hover:from-[#FF7F24]/5 group-hover:via-[#40297B]/5 group-hover:to-[#FF7F24]/5 transition-all duration-500"></div>

            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-[#40297B]/10 flex items-center justify-center text-3xl text-[#40297B] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <i className="fas fa-laptop-house"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Virtual Internship
              </h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Gain real-world experience through remote internships with top
                companies worldwide.
              </p>
              <Link
                href="/services/internships"
                className="inline-flex items-center gap-2 text-[#40297B] font-semibold group-hover:gap-3 transition-all"
              >
                Apply Now{" "}
                <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
              </Link>
            </div>
          </div>

          {/* 5. Employer Engagement */}
          <div className="service-card group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-[#FF7F24]/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#FF7F24]/10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FF7F24]/0 via-[#40297B]/0 to-[#FF7F24]/0 group-hover:from-[#FF7F24]/5 group-hover:via-[#40297B]/5 group-hover:to-[#FF7F24]/5 transition-all duration-500"></div>

            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-[#FF7F24]/10 flex items-center justify-center text-3xl text-[#FF7F24] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <i className="fas fa-handshake"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Employer Engagement
              </h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Connect with hiring partners, attend career fairs, and access
                exclusive job postings.
              </p>
              <Link
                href="/services/employers"
                className="inline-flex items-center gap-2 text-[#FF7F24] font-semibold group-hover:gap-3 transition-all"
              >
                Connect{" "}
                <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
              </Link>
            </div>
          </div>

          {/* 6. AI Career Assistant */}
          <div className="service-card group relative bg-gradient-to-br from-[#FF7F24]/10 via-[#40297B]/10 to-[#FF7F24]/10 backdrop-blur-sm border border-[#FF7F24]/30 rounded-2xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-[#FF7F24]/20 hover:border-[#FF7F24]">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FF7F24]/0 via-[#40297B]/0 to-[#FF7F24]/0 group-hover:from-[#FF7F24]/10 group-hover:via-[#40297B]/10 group-hover:to-[#FF7F24]/10 transition-all duration-500"></div>

            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-[#FF7F24]/20 flex items-center justify-center text-3xl text-[#FF7F24] mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <i className="fas fa-robot"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                AI Career Assistant
              </h3>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Get instant career advice, resume reviews, and job readiness
                assessments powered by AI.
              </p>
              <Link
                href="/services/readiness"
                className="inline-flex items-center gap-2 text-[#FF7F24] font-semibold group-hover:gap-3 transition-all"
              >
                Chat with AI{" "}
                <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
              </Link>
              <div className="absolute -top-2 -right-2 px-3 py-1 bg-[#FF7F24] text-xs font-bold text-white rounded-full animate-pulse">
                NEW
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
