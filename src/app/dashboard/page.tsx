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
  appointments,
  staffProfiles,
  assessmentAttempts,
  virtualInternshipEnrollments,
  jobRecommendations,
  careerFairs,
} from "@/db/schema";
import { getCurrentUser, ensureStudentProfileForUser } from "@/lib/auth/session";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StudentAppointmentScheduler } from "@/components/dashboard/student-appointment-scheduler";

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
  if (user.role === "EMPLOYER") {
    redirect("/employer");
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
    try {
      const healedProfile = await ensureStudentProfileForUser(user.id, user.email);
      if (healedProfile) {
        student = healedProfile as unknown as InferSelectModel<typeof studentProfiles>;
      }
    } catch (healErr) {
      console.error("[Dashboard] Auto-heal error:", healErr);
    }
  }

  if (!student) {
    student = {
      id: user.id,
      userId: user.id,
      masterRecordId: null,
      regNumber: "KSITM/STUDENT",
      fullName: user.email.split("@")[0].toUpperCase(),
      department: "Computer Software Engineering",
      level: "National Diploma I (ND 1)",
      phone: null,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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

    // Remove Career Mentorship from Student Dashboard
    entitlements = entitlements.filter(
      (e) => e.slug !== "mentorship" && !e.title.toLowerCase().includes("mentor"),
    );
  } catch (err) {
    console.error("[Dashboard] Error fetching entitlements:", err);
  }

  // Fetch student's scheduled appointments
  let studentAppointments: Array<{
    id: string;
    requestId?: string | null;
    staffId: string;
    staffName: string;
    staffDesignation?: string | null;
    scheduledStart: Date;
    scheduledEnd: Date;
    meetingLocation: string;
    status: "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    studentVisibleNotes?: string | null;
    createdAt: Date;
  }> = [];

  try {
    const rawAppts = await db
      .select({
        id: appointments.id,
        requestId: appointments.consultationRequestId,
        staffId: appointments.staffId,
        staffName: staffProfiles.fullName,
        staffDesignation: staffProfiles.designation,
        scheduledStart: appointments.scheduledStart,
        scheduledEnd: appointments.scheduledEnd,
        meetingLocation: appointments.meetingLocation,
        status: appointments.status,
        studentVisibleNotes: appointments.studentVisibleNotes,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .leftJoin(staffProfiles, eq(appointments.staffId, staffProfiles.id))
      .where(eq(appointments.studentId, student.id))
      .orderBy(desc(appointments.scheduledStart));

    studentAppointments = rawAppts.map((a) => ({
      id: a.id,
      requestId: a.requestId,
      staffId: a.staffId || "",
      staffName: a.staffName || "Career Advisory Staff",
      staffDesignation: a.staffDesignation,
      scheduledStart: a.scheduledStart,
      scheduledEnd: a.scheduledEnd,
      meetingLocation: a.meetingLocation || "Career Services Centre",
      status: a.status as "SCHEDULED" | "RESCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
      studentVisibleNotes: a.studentVisibleNotes,
      createdAt: a.createdAt,
    }));
  } catch (err) {
    console.error("[Dashboard] Error fetching appointments:", err);
  }

  // Fetch consultation requests
  let studentConsultations: Array<{
    id: string;
    category: string;
    reason: string;
    preferredDate: string;
    preferredTimeSlot: string;
    status: "REQUESTED" | "UNDER_REVIEW" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    studentNotes?: string | null;
    reviewedByStaffId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  try {
    const rawReqs = await db
      .select()
      .from(consultationRequests)
      .where(eq(consultationRequests.studentId, student.id))
      .orderBy(desc(consultationRequests.createdAt));

    studentConsultations = rawReqs.map((r) => ({
      id: r.id,
      category: r.category,
      reason: r.reason,
      preferredDate: String(r.preferredDate),
      preferredTimeSlot: r.preferredTimeSlot,
      status: r.status as "REQUESTED" | "UNDER_REVIEW" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
      studentNotes: r.studentNotes,
      reviewedByStaffId: r.reviewedByStaffId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  } catch (err) {
    console.error("[Dashboard] Error fetching consultations:", err);
  }

  const activeServicesCount = entitlements.filter(
    (e) => e.status === "ACTIVE",
  ).length;

  let assignedAssessmentsCount = 0;
  try {
    const studentAttempts = await db
      .select({ id: assessmentAttempts.id })
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.studentId, student.id));
    assignedAssessmentsCount = studentAttempts.length;
  } catch (err) {
    console.error("[Dashboard] Error fetching assessment attempts:", err);
  }

  let activeInternshipsCount = 0;
  try {
    const studentInternships = await db
      .select({ id: virtualInternshipEnrollments.id })
      .from(virtualInternshipEnrollments)
      .where(eq(virtualInternshipEnrollments.studentId, student.id));
    activeInternshipsCount = studentInternships.length;
  } catch (err) {
    console.error("[Dashboard] Error fetching internship enrollments:", err);
  }

  let recommendedJobsCount = 0;
  try {
    const studentRecs = await db
      .select({ id: jobRecommendations.id })
      .from(jobRecommendations)
      .where(eq(jobRecommendations.studentId, student.id));
    recommendedJobsCount = studentRecs.length;
  } catch (err) {
    console.error("[Dashboard] Error fetching job recommendations:", err);
  }

  let publishedCareerFairsCount = 0;
  try {
    const fairs = await db
      .select({ id: careerFairs.id })
      .from(careerFairs)
      .where(eq(careerFairs.isPublished, true));
    publishedCareerFairsCount = fairs.length;
  } catch (err) {
    console.error("[Dashboard] Error fetching career fairs:", err);
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white">
      <DashboardHeader student={student} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            href="/dashboard/modules"
            className="group block rounded-2xl border border-orange-400/30 bg-[#101023] p-5 text-white transition-all hover:border-orange-500 hover:bg-[#14142d]"
          >
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-bold group-hover:text-orange-400 transition-colors">
                My Modules
              </span>
              <i className="fas fa-arrow-right text-orange-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <span className="mt-2 block text-xs text-gray-400">
              Start assigned activities, continue your progress and view completed work.
            </span>
          </Link>

          <Link
            href="/dashboard/assessments"
            className="group block rounded-2xl border border-purple-400/30 bg-[#101023] p-5 text-white transition-all hover:border-purple-500 hover:bg-[#14142d]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold group-hover:text-purple-300 transition-colors">
                  Job Readiness
                </span>
                {assignedAssessmentsCount > 0 && (
                  <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                    {assignedAssessmentsCount}
                  </span>
                )}
              </div>
              <i className="fas fa-arrow-right text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <span className="mt-2 block text-xs text-gray-400">
              Take objective exams, test workplace readiness, and view verified scores.
            </span>
          </Link>

          <Link
            href="/dashboard/internships"
            className="group block rounded-2xl border border-cyan-400/30 bg-[#101023] p-5 text-white transition-all hover:border-cyan-500 hover:bg-[#14142d]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold group-hover:text-cyan-300 transition-colors">
                  Virtual Internships
                </span>
                {activeInternshipsCount > 0 && (
                  <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                    {activeInternshipsCount}
                  </span>
                )}
              </div>
              <i className="fas fa-arrow-right text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <span className="mt-2 block text-xs text-gray-400">
              Simulated industry projects, deliverable outcomes, and evaluations.
            </span>
          </Link>

          <Link
            href="/dashboard/jobs"
            className="group block rounded-2xl border border-emerald-400/30 bg-[#101023] p-5 text-white transition-all hover:border-emerald-500 hover:bg-[#14142d]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold group-hover:text-emerald-300 transition-colors">
                  Job Board
                </span>
                {recommendedJobsCount > 0 && (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    {recommendedJobsCount} Rec.
                  </span>
                )}
              </div>
              <i className="fas fa-arrow-right text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <span className="mt-2 block text-xs text-gray-400">
              Verified employer openings, advisor recommendations, and supervision.
            </span>
          </Link>

          <Link
            href="/dashboard/resume"
            className="group block rounded-2xl border border-amber-400/30 bg-[#101023] p-5 text-white transition-all hover:border-amber-500 hover:bg-[#14142d]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold group-hover:text-amber-300 transition-colors">
                  Resume Studio
                </span>
                <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  ATS Ready
                </span>
              </div>
              <i className="fas fa-arrow-right text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <span className="mt-2 block text-xs text-gray-400">
              Harvard ATS resume builder, live scoring audit, and instant PDF download.
            </span>
          </Link>

          <Link
            href="/dashboard/career-fair"
            className="group block rounded-2xl border border-rose-400/30 bg-[#101023] p-5 text-white transition-all hover:border-rose-500 hover:bg-[#14142d]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold group-hover:text-rose-300 transition-colors">
                  Career Fair
                </span>
                {publishedCareerFairsCount > 0 && (
                  <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                    {publishedCareerFairsCount} Live
                  </span>
                )}
              </div>
              <i className="fas fa-arrow-right text-rose-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <span className="mt-2 block text-xs text-gray-400">
              Employer expos, digital passes, and company booth recruitment.
            </span>
          </Link>
        </div>

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
              <a
                href="#appointments-section"
                className="py-3 px-6 rounded-xl bg-[#FF7F24] text-[#0A0A1A] font-extrabold text-sm hover:bg-[#40297B] hover:text-white transition-all text-center shadow-lg shadow-[#FF7F24]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fas fa-calendar-check" aria-hidden="true"></i>
                <span>Request Consultation</span>
              </a>
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
                Advisory Sessions
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#FF7F24]/10 border border-[#FF7F24]/20 text-[#FF7F24] flex items-center justify-center text-sm">
                <i className="fas fa-user-tie" aria-hidden="true"></i>
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {studentAppointments.length + studentConsultations.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Appointments & active requests
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
              Core institutional career services are immediately accessible to all verified KSITM scholars.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entitlements.map((entitlement) => {
              const SERVICE_CONFIG: Record<
                string,
                {
                  href: string;
                  actionLabel: string;
                  isAnchor?: boolean;
                  comingSoon?: boolean;
                  note?: string;
                }
              > = {
                consultations: {
                  href: "#appointments-section",
                  actionLabel: "Appointment Scheduler",
                  isAnchor: true,
                  note: "Schedule & manage advisor meetings",
                },
                resume: {
                  href: "/dashboard/resume",
                  actionLabel: "Open Resume Studio",
                  note: "ATS Harvard formatting & scoring",
                },
                training: {
                  href: "/dashboard/modules",
                  actionLabel: "Open Training Modules",
                  note: "Institutional employability courseware",
                },
                internships: {
                  href: "/dashboard/internships",
                  actionLabel: "Open Virtual Internships",
                  note: "Simulated projects & evaluation",
                },
                employers: {
                  href: "/dashboard/jobs",
                  actionLabel: "Browse Job Board",
                  note: "Verified vacancies & placement",
                },
                readiness: {
                  href: "/dashboard/assessments",
                  actionLabel: "Take Assessments",
                  note: "Diagnostic scoring & exams",
                },
                "career-fair": {
                  href: "/dashboard/career-fair",
                  actionLabel: "Explore Career Fairs",
                  note: "Employer booths & digital passes",
                },
              };

              const config = SERVICE_CONFIG[entitlement.slug] || {
                href: `/services/${entitlement.slug}`,
                actionLabel: "Explore Service",
              };

              const isComingSoon = config.comingSoon || entitlement.status === "COMING_SOON";
              const isActive = !isComingSoon && entitlement.status === "ACTIVE";
              const isAi = entitlement.slug.includes("ai");

              return (
                <article
                  key={entitlement.id}
                  className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between ${
                    isAi
                      ? "bg-gradient-to-br from-[#40297B]/40 to-[#FF7F24]/20 border border-[#FF7F24]/40"
                      : "bg-[#101023] border border-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
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
                          isComingSoon
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : isActive
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-gray-500/10 border-gray-500/30 text-gray-400"
                        }`}
                      >
                        {isComingSoon
                          ? "⏳ Coming Soon"
                          : isActive
                            ? "● Active"
                            : "🔒 Locked"}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">
                      {entitlement.title}
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed mb-6">
                      {entitlement.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs mt-auto">
                    <span className="text-gray-400">
                      {isComingSoon
                        ? "Launching Next Cohort"
                        : isActive
                          ? "Service Active & Ready"
                          : "Requires Advisor Assessment"}
                    </span>

                    {isComingSoon ? (
                      <span className="text-amber-400/80 font-bold inline-flex items-center gap-1 cursor-default">
                        <span>Coming Soon</span>
                        <i className="fas fa-clock text-[10px]" aria-hidden="true" />
                      </span>
                    ) : config.isAnchor ? (
                      <a
                        href={config.href}
                        className="text-[#FF7F24] font-bold hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{config.actionLabel}</span>
                        <i
                          className="fas fa-chevron-right text-[10px]"
                          aria-hidden="true"
                        ></i>
                      </a>
                    ) : (
                      <Link
                        href={config.href}
                        className="text-[#FF7F24] font-bold hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{config.actionLabel}</span>
                        <i
                          className="fas fa-chevron-right text-[10px]"
                          aria-hidden="true"
                        ></i>
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Student Appointment Scheduler Component */}
        <StudentAppointmentScheduler
          initialAppointments={studentAppointments}
          initialRequests={studentConsultations}
        />

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
