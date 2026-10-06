import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { careerServices, studentServiceEntitlements, trainingCategories, trainingVideos } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { MediaPlayer } from "@/components/training-media-player";

export const metadata: Metadata = { title: "Skills Training — KSITM Careers", description: "Employability skills training videos for KSITM students." };
export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "STAFF") redirect("/staff");
  if (user.role !== "SUPER_ADMIN") {
    const [trainingAccess] = await db.select({ status: studentServiceEntitlements.status }).from(studentServiceEntitlements).innerJoin(careerServices, eq(studentServiceEntitlements.serviceId, careerServices.id)).where(and(eq(studentServiceEntitlements.studentId, user.studentProfile?.id || "00000000-0000-0000-0000-000000000000"), eq(careerServices.slug, "training"))).limit(1);
    if (!trainingAccess || trainingAccess.status !== "ACTIVE") return <main className="min-h-screen bg-[#0A0A1A] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[.04] p-8 text-center shadow-2xl"><i className="fas fa-lock text-4xl text-[#FF7F24]" aria-hidden="true" /><h1 className="mt-5 text-3xl font-extrabold">Skills Training is locked</h1><p className="mt-3 text-gray-400">Your Career Assistant will activate this service when it becomes part of your career development plan.</p></div></main>;
  }
  const videos = await db.select({ id: trainingVideos.id, title: trainingVideos.title, description: trainingVideos.description, videoUrl: trainingVideos.videoUrl, videoId: trainingVideos.videoId, videoProvider: trainingVideos.videoProvider, thumbnailUrl: trainingVideos.thumbnailUrl, instructor: trainingVideos.instructor, category: trainingCategories.name }).from(trainingVideos).innerJoin(trainingCategories, eq(trainingVideos.categoryId, trainingCategories.id)).where(eq(trainingVideos.isPublished, true)).orderBy(asc(trainingVideos.displayOrder), asc(trainingVideos.createdAt));
  return <main className="min-h-screen bg-[#0A0A1A] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="mb-10"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF7F24]">Employability skills</p><h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Skills Training Videos</h1></div>{user.role === "SUPER_ADMIN" && <Link href="/admin" className="rounded-xl bg-[#FF7F24] px-4 py-2.5 text-sm font-extrabold text-[#0A0A1A] transition hover:bg-[#40297B] hover:text-white">Back to Admin</Link>}</div><p className="mt-3 max-w-2xl text-gray-400">Watch curated training published by KSITM Career Services to build practical workplace confidence.</p></div>{videos.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.03] p-12 text-center text-gray-400">No training videos have been published yet.</div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{videos.map((video) => <article key={video.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] shadow-xl"><MediaPlayer title={video.title} videoUrl={video.videoUrl} videoId={video.videoId} videoProvider={video.videoProvider} poster={video.thumbnailUrl} /><div className="p-5"><span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7F24]">{video.category}</span><h2 className="mt-2 text-lg font-bold">{video.title}</h2><p className="mt-2 text-sm leading-6 text-gray-400">{video.description}</p>{video.instructor && <p className="mt-3 text-xs text-gray-500">Instructor: {video.instructor}</p>}</div></article>)}</div>}</div></main>;
}
