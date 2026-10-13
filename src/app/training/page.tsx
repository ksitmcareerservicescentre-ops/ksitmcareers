/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  careerServices,
  studentServiceEntitlements,
  trainingCategories,
  trainingVideos,
  employabilityResources,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { MediaPlayer } from "@/components/training-media-player";

export const metadata: Metadata = {
  title: "Skills Training & Resources — KSITM Careers",
  description:
    "Employability skills training materials and educational resources for KSITM students.",
};

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "STAFF") redirect("/staff");

  if (user.role !== "SUPER_ADMIN") {
    const [trainingAccess] = await db
      .select({ status: studentServiceEntitlements.status })
      .from(studentServiceEntitlements)
      .innerJoin(
        careerServices,
        eq(studentServiceEntitlements.serviceId, careerServices.id),
      )
      .where(
        and(
          eq(
            studentServiceEntitlements.studentId,
            user.studentProfile?.id || "00000000-0000-0000-0000-000000000000",
          ),
          eq(careerServices.slug, "training"),
        ),
      )
      .limit(1);

    if (!trainingAccess || trainingAccess.status !== "ACTIVE") {
      return (
        <main className="min-h-screen bg-[#0A0A1A] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[.04] p-8 text-center shadow-2xl">
            <i
              className="fas fa-lock text-4xl text-[#FF7F24]"
              aria-hidden="true"
            />
            <h1 className="mt-5 text-3xl font-extrabold">
              Skills Training is locked
            </h1>
            <p className="mt-3 text-gray-400">
              Your Career Assistant will activate this service when it becomes
              part of your career development plan.
            </p>
          </div>
        </main>
      );
    }
  }

  const [videos, materials] = await Promise.all([
    db
      .select({
        id: trainingVideos.id,
        title: trainingVideos.title,
        description: trainingVideos.description,
        videoUrl: trainingVideos.videoUrl,
        videoId: trainingVideos.videoId,
        videoProvider: trainingVideos.videoProvider,
        thumbnailUrl: trainingVideos.thumbnailUrl,
        instructor: trainingVideos.instructor,
        category: trainingCategories.name,
      })
      .from(trainingVideos)
      .innerJoin(
        trainingCategories,
        eq(trainingVideos.categoryId, trainingCategories.id),
      )
      .where(eq(trainingVideos.isPublished, true))
      .orderBy(asc(trainingVideos.displayOrder), asc(trainingVideos.createdAt)),

    db
      .select()
      .from(employabilityResources)
      .where(eq(employabilityResources.isPublished, true))
      .orderBy(desc(employabilityResources.createdAt)),
  ]);

  return (
    <main className="min-h-screen bg-[#0A0A1A] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF7F24]">
                Employability Skills Curriculum
              </p>
              <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">
                Training Materials & Resource Hub
              </h1>
            </div>
            {user.role === "SUPER_ADMIN" ? (
              <Link
                href="/admin"
                className="rounded-xl bg-[#FF7F24] px-4 py-2.5 text-sm font-extrabold text-[#0A0A1A] transition hover:bg-[#40297B] hover:text-white"
              >
                Back to Admin
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10"
              >
                ← Back to Dashboard
              </Link>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-sm text-gray-400">
            Access curated documents, templates, roadmaps, and video sessions shared by KSITM career masters and faculty advisors.
          </p>
        </div>

        {/* Section 1: Educational Documents & Resource Shares */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h2 className="text-xl font-black text-white sm:text-2xl">
                Faculty Educational Materials & Document Shares
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Official templates, ATS guides, and interview playbooks uploaded with academic directives.
              </p>
            </div>
            <span className="rounded-full bg-orange-500/10 border border-orange-500/30 px-3 py-1 text-xs font-bold text-orange-400 font-mono">
              {materials.length} Materials
            </span>
          </div>

          {materials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.03] p-8 text-center text-xs text-gray-400">
              No educational documents have been uploaded yet. Check back soon.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {materials.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c0c1e] p-5 space-y-4 shadow-xl hover:border-orange-500/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                        {item.category}
                      </span>
                      <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                        {item.resourceType}
                      </span>
                    </div>

                    <h3 className="font-academic text-base font-bold text-white line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {/* Why Shared */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs space-y-1">
                      <div className="text-[10px] font-mono uppercase font-bold text-orange-300">
                        Why This Was Shared:
                      </div>
                      <p className="text-gray-300 leading-relaxed line-clamp-3">
                        {item.whyShared}
                      </p>
                    </div>

                    {/* How to Use */}
                    <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 text-xs space-y-1">
                      <div className="text-[10px] font-mono uppercase font-bold text-emerald-400">
                        How to Use / What to Do:
                      </div>
                      <p className="text-gray-300 leading-relaxed line-clamp-3">
                        {item.howToUse}
                      </p>
                    </div>

                    {/* Uploader Profile Badge */}
                    <div className="rounded-xl border border-white/[0.06] bg-[#080816] p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.uploaderAvatarUrl ? (
                          <img
                            src={item.uploaderAvatarUrl}
                            alt={item.uploaderName}
                            className="h-8 w-8 rounded-full object-cover border border-orange-500/30 shrink-0"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs border border-orange-500/30">
                            {item.uploaderName[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">
                            {item.uploaderName}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">
                            {item.uploaderRole}
                          </div>
                        </div>
                      </div>

                      {item.uploaderLinkedIn && (
                        <a
                          href={item.uploaderLinkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-400 hover:bg-blue-500/20 transition-colors shrink-0"
                          title="Author Web / Profile Link"
                        >
                          <i className={item.uploaderLinkedIn.includes("linkedin.com") ? "fab fa-linkedin" : item.uploaderLinkedIn.includes("github.com") ? "fab fa-github" : "fas fa-external-link-alt"} />
                          <span>{item.uploaderLinkedIn.includes("linkedin.com") ? "LinkedIn" : item.uploaderLinkedIn.includes("github.com") ? "GitHub" : "Link"}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <a
                    href={item.resourceAddress}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-[#090915] transition-all hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95"
                  >
                    <i className="fas fa-external-link-alt text-xs" />
                    <span>Open / Download Material</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Video Masterclasses */}
        <section className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h2 className="text-xl font-black text-white sm:text-2xl">
                Video Masterclasses
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Curated recorded training sessions to prepare for interviews and work life.
              </p>
            </div>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-400 font-mono">
              {videos.length} Videos
            </span>
          </div>

          {videos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.03] p-8 text-center text-xs text-gray-400">
              No training videos have been published yet.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {videos.map((video) => (
                <article
                  key={video.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] shadow-xl"
                >
                  <MediaPlayer
                    title={video.title}
                    videoUrl={video.videoUrl}
                    videoId={video.videoId}
                    videoProvider={video.videoProvider}
                    poster={video.thumbnailUrl}
                  />
                  <div className="p-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7F24]">
                      {video.category}
                    </span>
                    <h2 className="mt-2 text-lg font-bold">{video.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {video.description}
                    </p>
                    {video.instructor && (
                      <p className="mt-3 text-xs text-gray-500">
                        Instructor: {video.instructor}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
