import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import type { CareerServiceRecord } from "@/db/schema";

const ICON_MAP: Record<string, string> = {
  calendar: "fas fa-calendar-check",
  people: "fas fa-users",
  document: "fas fa-file-alt",
  play: "fas fa-video",
  laptop: "fas fa-laptop-house",
  briefcase: "fas fa-handshake",
  check: "fas fa-chart-line",
};

const COLOR_MAP: Record<number, { border: string; bg: string; text: string; glow: string }> = {
  0: { border: "hover:border-[#FF7F24]/50", bg: "bg-[#FF7F24]/10", text: "text-[#FF7F24]", glow: "hover:shadow-[#FF7F24]/10" },
  1: { border: "hover:border-[#40297B]/50", bg: "bg-[#40297B]/10", text: "text-[#40297B]", glow: "hover:shadow-[#40297B]/10" },
  2: { border: "hover:border-[#FF7F24]/50", bg: "bg-[#FF7F24]/10", text: "text-[#FF7F24]", glow: "hover:shadow-[#FF7F24]/10" },
  3: { border: "hover:border-[#40297B]/50", bg: "bg-[#40297B]/10", text: "text-[#40297B]", glow: "hover:shadow-[#40297B]/10" },
  4: { border: "hover:border-[#FF7F24]/50", bg: "bg-[#FF7F24]/10", text: "text-[#FF7F24]", glow: "hover:shadow-[#FF7F24]/10" },
  5: { border: "hover:border-[#40297B]/50", bg: "bg-[#40297B]/10", text: "text-[#40297B]", glow: "hover:shadow-[#40297B]/10" },
  6: { border: "hover:border-[#FF7F24]/50", bg: "bg-[#FF7F24]/10", text: "text-[#FF7F24]", glow: "hover:shadow-[#FF7F24]/10" },
};

function getServiceLink(slug: string, role?: string | null): string {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "STAFF") return "/staff";
  if (role === "EMPLOYER") return "/employer";
  if (role === "STUDENT") {
    switch (slug) {
      case "consultations":
        return "/dashboard";
      case "resume":
        return "/dashboard";
      case "training":
        return "/training";
      case "internships":
        return "/dashboard/internships";
      case "employers":
        return "/dashboard/jobs";
      case "readiness":
        return "/dashboard/assessments";
      default:
        return "/dashboard";
    }
  }
  return `/services/${slug}`;
}

function getServiceActionText(slug: string): string {
  switch (slug) {
    case "consultations":
      return "Book Session";
    case "resume":
      return "Build Resume";
    case "training":
      return "Watch Training";
    case "internships":
      return "Explore Internships";
    case "employers":
      return "View Opportunities";
    case "readiness":
      return "Take Assessment";
    case "mentorship":
      return "Connect Mentor";
    default:
      return "Explore Service";
  }
}

export async function Services({
  services = [],
}: {
  services?: CareerServiceRecord[];
}) {
  const user = await getCurrentUser();

  if (!services || services.length === 0) return null;

  return (
    <section id="services" className="py-24 bg-[#0A0A1A] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A1A] via-[#0A0A1A] to-[#0A0A1A]/50 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Career{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7F24] to-[#40297B]">
              Services
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to launch your career — verified, institutional, and
            designed for real student success.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => {
            const iconClass = ICON_MAP[service.icon] || "fas fa-star";
            const color = COLOR_MAP[idx % 7] || COLOR_MAP[0];
            const href = getServiceLink(service.slug, user?.role);
            const actionText = getServiceActionText(service.slug);

            return (
              <div
                key={service.id}
                className={`service-card group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 ${color.border} hover:-translate-y-2 hover:shadow-2xl ${color.glow} flex flex-col justify-between`}
              >
                <div className="relative">
                  <div
                    className={`w-16 h-16 rounded-xl ${color.bg} flex items-center justify-center text-3xl ${color.text} mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                  >
                    <i className={iconClass} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {service.title}
                  </h3>
                  <p className="text-gray-400 mb-6 leading-relaxed text-sm">
                    {service.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <Link
                    href={href}
                    className={`inline-flex items-center gap-2 ${color.text} font-semibold text-sm group-hover:gap-3 transition-all`}
                  >
                    <span>{actionText}</span>
                    <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href={`/services/${service.slug}`}
                    className="text-[11px] text-gray-500 hover:text-gray-300 font-mono transition-colors"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
