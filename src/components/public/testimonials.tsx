import type { TestimonialRecord } from "@/db/schema";

export function Testimonials({
  testimonials = [],
}: {
  testimonials?: TestimonialRecord[];
}) {
  if (!testimonials || testimonials.length === 0) return null;

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
          {testimonials.map((item, idx) => (
            <div
              key={item.id}
              className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-[#FF7F24]/30 hover:-translate-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex text-[#FF7F24] text-xl mb-4">
                  {Array.from({ length: item.rating || 5 }).map((_, i) => (
                    <i key={i} className="fas fa-star" />
                  ))}
                </div>
                <blockquote className="text-gray-300 text-base leading-relaxed mb-6 italic">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                    idx % 2 === 0
                      ? "from-[#FF7F24] to-[#40297B]"
                      : "from-[#40297B] to-[#FF7F24]"
                  } flex items-center justify-center text-white font-bold text-sm`}
                >
                  {item.avatarInitials || item.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{item.name}</p>
                  <p className="text-gray-400 text-xs">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
