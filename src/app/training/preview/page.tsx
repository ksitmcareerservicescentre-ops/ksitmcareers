import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { trainingCategories, trainingVideos } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import Link from "next/link";
import { MediaPlayer } from "@/components/training-media-player";

export const metadata: Metadata = { title: "Video Center", description: "Published learning videos." };
export const dynamic = "force-dynamic";

export default async function TrainingPreviewPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");
  const videos = await db.select({ id: trainingVideos.id, title: trainingVideos.title, description: trainingVideos.description, videoUrl: trainingVideos.videoUrl, videoId: trainingVideos.videoId, videoProvider: trainingVideos.videoProvider, thumbnailUrl: trainingVideos.thumbnailUrl, instructor: trainingVideos.instructor, category: trainingCategories.name }).from(trainingVideos).innerJoin(trainingCategories, eq(trainingVideos.categoryId, trainingCategories.id)).where(eq(trainingVideos.isPublished, true)).orderBy(asc(trainingVideos.displayOrder), desc(trainingVideos.updatedAt));
  return <main className="min-h-screen bg-[#0A0A1A] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF7F24]">Video Center</p><h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Learning Videos</h1></div><Link href="/admin" className="rounded-xl bg-[#FF7F24] px-4 py-2.5 text-sm font-extrabold text-[#0A0A1A] transition hover:bg-[#40297B] hover:text-white">Back to Admin</Link></div>{videos.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.03] p-12 text-center text-gray-400">No published videos are available.</div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{videos.map((video) => <article key={video.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] shadow-2xl shadow-black/20"><div className="bg-black"><MediaPlayer title={video.title} videoUrl={video.videoUrl} videoId={video.videoId} videoProvider={video.videoProvider} poster={video.thumbnailUrl} /></div><div className="p-5"><span className="text-[10px] font-bold uppercase tracking-widest text-[#FF7F24]">{video.category}</span><h2 className="mt-2 text-lg font-bold">{video.title}</h2><p className="mt-2 text-sm leading-6 text-gray-400">{video.description}</p>{video.instructor && <p className="mt-3 text-xs text-gray-500">Instructor: {video.instructor}</p>}</div></article>)}</div>}</div></main>;
}
