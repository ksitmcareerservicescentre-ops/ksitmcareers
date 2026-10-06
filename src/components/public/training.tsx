export function Training() {
  return (
    <section
      id="training"
      className="py-24 bg-gradient-to-br from-[#15102d] to-[#0A0A1A] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-[#FF7F24] font-bold uppercase tracking-[.2em] text-sm mb-3">
            Training
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5">
            Build skills for the future
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Discover the skills training, virtual internship and career guidance
            services featured on this page.
          </p>
          <a
            href="#services"
            className="inline-flex mt-8 px-7 py-3 rounded-full bg-[#FF7F24] text-[#0A0A1A] font-bold hover:bg-[#40297B] hover:text-white transition-colors"
          >
            Explore Services
          </a>
        </div>
        <div className="grid gap-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-white">
            <i className="fas fa-play-circle text-[#FF7F24] mr-3"></i> Skills
            training videos
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-white">
            <i className="fas fa-laptop-house text-[#FF7F24] mr-3"></i> Virtual
            internships
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-white">
            <i className="fas fa-user-tie text-[#FF7F24] mr-3"></i> Career
            guidance
          </div>
        </div>
      </div>
    </section>
  );
}
