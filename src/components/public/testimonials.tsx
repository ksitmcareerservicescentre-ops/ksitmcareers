export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-[#0A0A1A]/80 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A1A] via-transparent to-[#0A0A1A] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            What{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7F24] to-[#40297B]">
              Students Say
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Real stories from KSITM students who transformed their careers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-[#FF7F24]/30 hover:-translate-y-2">
            <div className="flex text-[#FF7F24] text-xl mb-4">
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
            </div>
            <blockquote className="text-gray-300 text-lg leading-relaxed mb-6">
              &ldquo;The AI assistant helped me refine my resume and I landed an
              internship within weeks. Incredible tool!&rdquo;
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF7F24] to-[#40297B] flex items-center justify-center text-white font-bold">
                AY
              </div>
              <div>
                <p className="text-white font-semibold">Amina Yusuf</p>
                <p className="text-gray-400 text-sm">
                  Computer Science, Year 3
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-[#40297B]/30 hover:-translate-y-2">
            <div className="flex text-[#FF7F24] text-xl mb-4">
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
            </div>
            <blockquote className="text-gray-300 text-lg leading-relaxed mb-6">
              &ldquo;The virtual internship program gave me real experience with
              a tech company. I feel confident for the job market.&rdquo;
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#40297B] to-[#FF7F24] flex items-center justify-center text-white font-bold">
                IM
              </div>
              <div>
                <p className="text-white font-semibold">Ibrahim Musa</p>
                <p className="text-gray-400 text-sm">Business Admin, Year 4</p>
              </div>
            </div>
          </div>

          <div className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-[#FF7F24]/30 hover:-translate-y-2">
            <div className="flex text-[#FF7F24] text-xl mb-4">
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
            </div>
            <blockquote className="text-gray-300 text-lg leading-relaxed mb-6">
              &ldquo;From resume building to employer connections, this platform
              has everything. I got my dream job through KSITM Careers.&rdquo;
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF7F24] to-[#40297B] flex items-center justify-center text-white font-bold">
                FB
              </div>
              <div>
                <p className="text-white font-semibold">Fatima Bello</p>
                <p className="text-gray-400 text-sm">
                  Mass Comm, Alumna &apos;25
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
