import type { Metadata } from "next";
import Link from "next/link";
import { getPublicStudentResumeAction } from "@/actions/resume";
import { PublicResumeViewer } from "@/components/resume/public-resume-viewer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicStudentResumeAction(id);

  if (!data) {
    return {
      title: "Resume Not Found — KSITM Careers",
      description: "The requested student resume could not be located.",
    };
  }

  return {
    title: `${data.student.fullName} — Verified Resume | KSITM Careers`,
    description: `${data.resume.headline || "Verified Candidate"} — Katsina State Institute of Technology and Management.`,
  };
}

export default async function PublicResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPublicStudentResumeAction(id);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-[#101023] p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-2xl">
            <i className="fas fa-file-circle-xmark" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Resume Record Not Found</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            The candidate identifier provided does not match any active verified student curriculum vitae on KSITM Careers.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-[#090915] hover:bg-orange-400 transition-all"
            >
              <i className="fas fa-home" />
              <span>Return to KSITM Careers</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <PublicResumeViewer data={data} />;
}
