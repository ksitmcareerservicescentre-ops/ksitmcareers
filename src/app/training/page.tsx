import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { trainingCategories, trainingVideos } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Skills Training — KSITM Careers", description: "Employability skills training videos for KSITM students." };
export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "SUPER_ADMIN") redirect("/admin");
  if (user.role === "STAFF") redirect("/staff");
  const videos = await db.select({ id: trainingVideos.id, title: trainingVideos.title, description: trainingVideos.description, videoId: trainingVideos.videoId, instructor: trainingVideos.instructor, category: trainingCategories.name }).from(trainingVideos).innerJoin(trainingCategories, eq(trainingVideos.categoryId, trainingCategories.id)).where(eq(trainingVideos.isPublished, true)).orderBy(asc(trainingVideos.displayOrder), asc(trainingVideos.createdAt));
  return <main className="min-h-screen bg-[#0A0A1A] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="mb-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF7F24]">Employability skills</p><h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Skills Training Videos</h1><p className="mt-3 max-w-2xl text-gray-400">Watch curated training published by KSITM Career Services to build practical workplace confidence.</p></div>{videos.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.03] p-12 text-center text-gray-400">No training videos have been published yet.</div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{videos.map((video) => <article key={video.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] shadow-xl"><div className="aspect-video bg-black"><iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${video.videoId}`} className="h-full w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div><div className="p-5"><span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7F24]">{video.category}</span><h2 className="mt-2 text-lg font-bold">{video.title}</h2><p className="mt-2 text-sm leading-6 text-gray-400">{video.description}</p>{video.instructor && <p className="mt-3 text-xs text-gray-500">Instructor: {video.instructor}</p>}</div></article>)}</div>}</div></main>;
}
