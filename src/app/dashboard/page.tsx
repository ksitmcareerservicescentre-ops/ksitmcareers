import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc, type InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import {
  studentProfiles,
  studentServiceEntitlements,
  careerServices,
  consultationRequests,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export const metadata: Metadata = {
  title: "Student Dashboard — KSITM Careers",
  description:
    "Manage your career services entitlements, consultation requests, and professional development resources.",
};

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }
  if (user.role === "STAFF") {
    redirect("/staff");
  }

  let student;
  try {
    const [foundStudent] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, user.id))
      .limit(1);
    student = foundStudent;
  } catch (err) {
    console.error("[Dashboard] Error fetching student profile:", err);
  }

  if (!student) {
    console.error("[Dashboard] Student profile not found for user:", user.id);
    redirect("/login");
  }

  // Fetch student's individual career service entitlements
  let entitlements: Array<{
    id: string;
    status: string;
    activatedAt: Date | null;
    recommendationNote: string | null;
    serviceId: string;
    slug: string;
    title: string;
    summary: string;
    icon: string;
    displayOrder: number;
  }> = [];

  try {
    entitlements = await db
      .select({
        id: studentServiceEntitlements.id,
        status: studentServiceEntitlements.status,
        activatedAt: studentServiceEntitlements.activatedAt,
        recommendationNote: studentServiceEntitlements.recommendationNote,
        serviceId: careerServices.id,
        slug: careerServices.slug,
        title: careerServices.title,
        summary: careerServices.summary,
        icon: careerServices.icon,
        displayOrder: careerServices.displayOrder,
      })
      .from(studentServiceEntitlements)
      .innerJoin(
        careerServices,
        eq(studentServiceEntitlements.serviceId, careerServices.id),
      )
      .where(eq(studentServiceEntitlements.studentId, student.id))
      .orderBy(careerServices.displayOrder);
  } catch (err) {
    console.error("[Dashboard] Error fetching entitlements:", err);
  }

  // Fetch consultation requests
  type Consultation = InferSelectModel<typeof consultationRequests>;
  let recentConsultations: Consultation[] = [];
  try {
    recentConsultations = await db
      .select()
      .from(consultationRequests)
      .where(eq(consultationRequests.studentId, student.id))
      .orderBy(desc(consultationRequests.createdAt))
      .limit(5);
  } catch (err) {
    console.error("[Dashboard] Error fetching consultations:", err);
  }

  const activeServicesCount = entitlements.filter(
    (e) => e.status === "ACTIVE",
  ).length;

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white">
      <DashboardHeader student={student} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Welcome Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#40297B]/40 via-[#101023] to-[#FF7F24]/15 border border-white/10 p-6 sm:p-10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF7F24]/15 border border-[#FF7F24]/30 text-[#FF7F24] text-xs font-bold uppercase tracking-wider mb-3">
                <i className="fas fa-check-circle" aria-hidden="true"></i>
                <span>Enrolled Student Portal</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                Welcome back, {student.fullName}
              </h1>
              <p className="text-gray-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                Your dedicated Career Services hub at Katsina State Institute of
                Technology and Management. Connect with advisors, track service
                entitlements, and build your professional trajectory.
              </p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-xs sm:text-sm text-gray-300">
                <span className="flex items-center gap-2">
                  <i
                    className="fas fa-id-badge text-[#FF7F24]"
                    aria-hidden="true"
                  ></i>
                  <span className="font-semibold text-white">Reg No:</span>{" "}
                  {student.regNumber}
                </span>
                <span className="flex items-center gap-2">
                  <i
                    className="fas fa-graduation-cap text-[#FF7F24]"
                    aria-hidden="true"
                  ></i>
                  <span className="font-semibold text-white">Dept:</span>{" "}
                  {student.department || "Academic Department Not Set"}
                </span>
                <span className="flex items-center gap-2">
                  <i
                    className="fas fa-layer-group text-[#FF7F24]"
                    aria-hidden="true"
                  ></i>
                  <span className="font-semibold text-white">Level:</span>{" "}
                  {student.level || "Enrolled"}
                </span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
              <Link
                href="/services/consultations"
                className="py-3 px-6 rounded-xl bg-[#FF7F24] text-[#0A0A1A] font-extrabold text-sm hover:bg-white transition-all text-center shadow-lg shadow-[#FF7F24]/20 flex items-center justify-center gap-2"
              >
                <i className="fas fa-calendar-check" aria-hidden="true"></i>
                <span>Request Consultation</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Status Metrics Overview */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#101023] border border-white/10 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                Active Entitlements
              </span>
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                <i className="fas fa-shield-alt" aria-hidden="true"></i>
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {activeServicesCount} / {entitlements.length || 7}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Active career development services
            </p>
          </div>

          <div className="bg-[#101023] border border-white/10 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                Consultations
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#FF7F24]/10 border border-[#FF7F24]/20 text-[#FF7F24] flex items-center justify-center text-sm">
                <i className="fas fa-user-tie" aria-hidden="true"></i>
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {recentConsultations.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Appointments & advisory sessions
            </p>
          </div>

          <div className="bg-[#101023] border border-white/10 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                Skills Training
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#40297B]/30 border border-[#40297B]/50 text-purple-300 flex items-center justify-center text-sm">
                <i className="fas fa-play-circle" aria-hidden="true"></i>
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              Available
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Employability video series
            </p>
          </div>

          <div className="bg-[#101023] border border-white/10 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                Job Readiness
              </span>
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-sm">
                <i className="fas fa-tasks" aria-hidden="true"></i>
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              Self-Serve
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Diagnostics & resume studio
            </p>
          </div>
        </section>

        {/* Career Services Entitlements Matrix */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[#FF7F24] font-bold uppercase tracking-widest text-xs">
                Individual Service Entitlements
              </p>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Your Career Development Hub
              </h2>
            </div>
            <p className="text-xs text-gray-400 max-w-md">
              Career Assistants assess individual student needs and activate
              advanced specialized services over time.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entitlements.map((entitlement) => {
              const isActive = entitlement.status === "ACTIVE";
              const isLocked = entitlement.status === "LOCKED";
              const isAi = entitlement.slug.includes("ai");

              return (
                <article
                  key={entitlement.id}
                  className={`relative rounded-2xl p-6 transition-all duration-300 ${
                    isAi
                      ? "bg-gradient-to-br from-[#40297B]/40 to-[#FF7F24]/20 border border-[#FF7F24]/40"
                      : "bg-[#101023] border border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-[#FF7F24] flex items-center justify-center text-xl">
                      <i
                        className={`fas fa-${entitlement.icon || "star"}`}
                        aria-hidden="true"
                      ></i>
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isActive
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : isLocked
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : "bg-gray-500/10 border-gray-500/30 text-gray-400"
                      }`}
                    >
                      {isActive
                        ? "● Active"
                        : isLocked
                          ? "🔒 Locked"
                          : entitlement.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">
                    {entitlement.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6">
                    {entitlement.summary}
                  </p>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      {isLocked
                        ? "Requires Advisor Assessment"
                        : "Service Ready"}
                    </span>
                    <Link
                      href={`/services/${entitlement.slug}`}
                      className="text-[#FF7F24] font-bold hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <i
                        className="fas fa-chevron-right text-[10px]"
                        aria-hidden="true"
                      ></i>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Consultations & Support Callout */}
        <section className="rounded-3xl bg-gradient-to-br from-[#101023] to-[#40297B]/30 border border-white/10 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                Need guidance or personalized career assessment?
              </h3>
              <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">
                Career Center Coordinator Nura Sadiq and Assistant Coordinator
                Abubakar Abdu are available to evaluate your aspirations, review
                your resume, and activate specialized industry engagement
                opportunities.
              </p>
            </div>
            <a
              href="mailto:contact@ksitmcareers.edu.ng?subject=Career%20Services%20Advisory%20Inquiry"
              className="py-3 px-5 rounded-xl border border-[#FF7F24] text-[#FF7F24] font-bold text-sm hover:bg-[#FF7F24] hover:text-[#0A0A1A] transition-colors text-center shrink-0"
            >
              Contact Advisory Team
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
