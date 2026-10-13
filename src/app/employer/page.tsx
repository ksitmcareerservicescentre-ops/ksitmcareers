import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getEmployerPortalDataAction } from "@/actions/employers";
import { EmployerPortal } from "@/components/employer/employer-portal";

export const metadata: Metadata = {
  title: "Employer Recruitment Portal — KSITM Careers",
  description:
    "Partner Organization Portal for Katsina State Institute of Technology and Management. Post vacancies and inspect vetted student candidates recommended by career advisors.",
};

export const dynamic = "force-dynamic";

export default async function EmployerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "EMPLOYER") {
    if (user.role === "SUPER_ADMIN") redirect("/admin");
    if (user.role === "STAFF") redirect("/staff");
    redirect("/dashboard");
  }

  const portalData = await getEmployerPortalDataAction();

  if (!portalData.success || !portalData.employer) {
    return (
      <main className="min-h-screen bg-[#070714] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#101023] p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <i className="fas fa-building text-2xl" />
          </div>
          <h1 className="text-xl font-bold text-white">Employer Account Inactive</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            {portalData.error ||
              "Your account is not linked to an active corporate organization record. Please contact the KSITM Career Services Directorate to complete institutional verification."}
          </p>
          <a
            href="mailto:careers@ksitm.edu.ng"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-black hover:bg-orange-400 transition-colors"
          >
            <i className="fas fa-envelope" />
            <span>Contact Career Directorate</span>
          </a>
        </div>
      </main>
    );
  }

  return (
    <EmployerPortal
      employer={portalData.employer}
      initialJobs={portalData.jobs}
      initialRecommendations={portalData.recommendations}
      userEmail={user.email}
    />
  );
}
